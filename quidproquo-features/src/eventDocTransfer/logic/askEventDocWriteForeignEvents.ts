import { askInlineFunctionExecute, AskResponse, Nullable } from 'quidproquo-core';

import { askEventDocResolveStore } from '../../eventDoc/context';
import { askEventDocEventWrite, askEventDocUpsert } from '../../eventDoc/data';
import { askEventDocHookStates } from '../../eventDoc/logic/askEventDocHookStates';
import {
  EventDocEffect,
  EventDocEvent,
  EventDocOnAppendInput,
  EventDocOnPublishInput,
  EventDocSummary,
  eventDocSummaryViewSchema,
} from '../../eventDoc/models';
import { foldEventDocSummary } from '../../eventDoc/summary';
import { askValidateModelOrThrowError } from '../../validation/askValidateModelOrThrowError';

export type EventDocWriteForeignEventsOptions = {
  // Attribution for the imported events - see EventDocBundleApplyOptions.importerUserId.
  importerUserId: string;
  // The tail was DISCARDED rather than appended to, so the hooks must fire even if nothing new was
  // written: the summary still changed.
  logRewritten?: boolean;
};

/**
 * Re-attribute one event to the importing user, keeping the original author's display name.
 *
 * The source id would be a dangling reference in the target directory, while the display name is a
 * denormalised snapshot that stays true regardless of which system it is read in. So the id becomes
 * answerable ("who put this here") and the name stays honest ("who wrote it").
 */
const toLocalActor = (event: EventDocEvent, importerUserId: string): EventDocEvent => ({
  ...event,
  payload: {
    ...event.payload,
    metadata: {
      ...event.payload.metadata,
      createdBy: { ...event.payload.metadata.createdBy, userId: importerUserId },
    },
  },
});

// The last Publish in a log, if any: what onPublish is fired for once the whole log has landed.
const findLatestPublishEvent = (events: EventDocEvent[]): Nullable<EventDocEvent> =>
  [...events].reverse().find((event) => event.type === EventDocEffect.Publish) ?? null;

// Fire the collection's post-append hooks ONCE for the doc, not once per imported event: per-event
// firing would replay every historical publish and (for onAppend) spam the target's websockets.
// Both hooks are contractually idempotent, and this is the shape a resumed import repeats safely.
// States are derived per fired event (askEventDocHookStates reads the just-written log back
// consistently), matching the append path's contract: the hook sees the document as of ITS event.
function* askEventDocFireImportHooks(docId: string, events: EventDocEvent[], summary: EventDocSummary): AskResponse<void> {
  const { onPublish, onAppend } = yield* askEventDocResolveStore();

  const tailEvent = events[events.length - 1];

  if (!tailEvent || (!onPublish && !onAppend)) {
    return;
  }

  const publishEvent = findLatestPublishEvent(events);

  if (onPublish && publishEvent) {
    const { state, previousState } = yield* askEventDocHookStates(docId, publishEvent);
    yield* askInlineFunctionExecute<void, EventDocOnPublishInput>(onPublish, { docId, event: publishEvent, summary, state, previousState });
  }

  if (onAppend) {
    const { state, previousState } = yield* askEventDocHookStates(docId, tailEvent);
    yield* askInlineFunctionExecute<void, EventDocOnAppendInput>(onAppend, { docId, event: tailEvent, summary, state, previousState });
  }
}

/**
 * Write foreign events into this collection's log almost verbatim: original index, createdAt and
 * clientMessageId preserved, so a later comparison still recognises them.
 *
 * The ONE thing rewritten is `createdBy.userId`, which becomes the importing user (see
 * toLocalActor). Event identity excludes it, so this does not disturb the fast-forward comparison.
 *
 * This deliberately does NOT go through askEventDocEventAppend, which restamps metadata and runs
 * the collection's validator. Replayed history was already validated at its origin, and a
 * validator that has since become stricter must not be able to rewrite the past.
 *
 * `events` is the doc's COMPLETE incoming log and `fromIndex` the first event not already present,
 * so the summary is rebuilt by folding the whole thing rather than patched incrementally. The
 * writes are conditional on (docId, eventId) in the store, which is what makes a partial import safe
 * to re-run.
 */
export function* askEventDocWriteForeignEvents(
  docId: string,
  events: EventDocEvent[],
  fromIndex: number,
  { importerUserId, logRewritten = false }: EventDocWriteForeignEventsOptions,
): AskResponse<number> {
  const { type } = yield* askEventDocResolveStore();

  const localised = events.map((event) => toLocalActor(event, importerUserId));
  const missing = localised.slice(fromIndex);

  for (const event of missing) {
    yield* askEventDocEventWrite(docId, event);
  }

  // Folded from the LOCALISED log, so the summary's createdBy/updatedBy are local ids too.
  // Nothing has to be renumbered: an import is a fast-forward of the SAME log, so the
  // incoming events' positions continue the local log exactly (the divergence check
  // guarantees the prefix matches), and each keeps its own.
  const summary = foldEventDocSummary(localised);
  yield* askValidateModelOrThrowError(summary, eventDocSummaryViewSchema);
  yield* askEventDocUpsert(summary);

  // `logRewritten` covers the forced-overwrite case where the tail was DISCARDED and nothing new
  // needed writing: the summary still changed, so a materialized read model is still stale.
  if (missing.length > 0 || logRewritten) {
    // The hook payload crosses into an inline function, which receives the STORED shape —
    // hence the key here, at the serialisation boundary rather than in the fold.
    yield* askEventDocFireImportHooks(docId, localised, { ...summary, type });
  }

  return missing.length;
}
