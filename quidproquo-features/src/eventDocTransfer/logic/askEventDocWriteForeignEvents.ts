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

/** Options for askEventDocWriteForeignEvents. */
export type EventDocWriteForeignEventsOptions = {
  importerUserId: string;
  // The tail was discarded, so the hooks must fire even when nothing new was written: the summary still changed.
  logRewritten?: boolean;
};

// The source user id would dangle in the target directory; the display name is a snapshot and stays true.
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

const findLatestPublishEvent = (events: EventDocEvent[]): Nullable<EventDocEvent> =>
  [...events].reverse().find((event) => event.type === EventDocEffect.Publish) ?? null;

// Hooks fire once per doc, not once per imported event: per-event firing would replay every historical publish.
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
 * Writes `events[fromIndex..]` into the collection's log verbatim except for `createdBy.userId`, which becomes the importer.
 * Bypasses askEventDocEventAppend on purpose: replayed history was validated at its origin and must not be restamped.
 * `events` is the complete incoming log; the import is a fast-forward, so ids continue the local log. Requires the store context.
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

  // Folded from the localised log so the summary's createdBy/updatedBy are local ids too.
  const summary = foldEventDocSummary(localised);
  yield* askValidateModelOrThrowError(summary, eventDocSummaryViewSchema);
  yield* askEventDocUpsert(summary);

  if (missing.length > 0 || logRewritten) {
    // The hook receives the stored shape, which carries `type`.
    yield* askEventDocFireImportHooks(docId, localised, { ...summary, type });
  }

  return missing.length;
}
