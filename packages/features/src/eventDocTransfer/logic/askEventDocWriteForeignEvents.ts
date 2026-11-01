import { askInlineFunctionExecute, AskResponse, Nullable } from '@qpqjs/core';

import { askEventDocStoreReadOrThrow } from '../../eventDoc/context';
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
import { askEventDocValidateForeignTail } from './askEventDocValidateForeignTail';
import { toEventDocLocalActor } from './toEventDocLocalActor';

/** Options for askEventDocWriteForeignEvents. */
export type EventDocWriteForeignEventsOptions = {
  importerUserId: string;
  // The tail was discarded, so the hooks must fire even when nothing new was written: the summary still changed.
  logRewritten?: boolean;
};

const findLatestPublishEvent = (events: EventDocEvent[]): Nullable<EventDocEvent> =>
  [...events].reverse().find((event) => event.type === EventDocEffect.Publish) ?? null;

// Hooks fire once per doc, not once per imported event: per-event firing would replay every historical publish.
function* askEventDocFireImportHooks(docId: string, events: EventDocEvent[], summary: EventDocSummary): AskResponse<void> {
  const { onPublish, onAppend } = yield* askEventDocStoreReadOrThrow();

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
 * Bypasses askEventDocEventAppend's restamping on purpose (replayed history keeps its ids and times) but not its gate: the
 * tail is validated and folded first, so a crafted bundle cannot land an event the document fold cannot read.
 * `events` is the complete incoming log; the import is a fast-forward, so ids continue the local log. Requires the store context.
 */
export function* askEventDocWriteForeignEvents(
  docId: string,
  events: EventDocEvent[],
  fromIndex: number,
  { importerUserId, logRewritten = false }: EventDocWriteForeignEventsOptions,
): AskResponse<number> {
  const { type } = yield* askEventDocStoreReadOrThrow();

  const localised = events.map((event) => toEventDocLocalActor(event, importerUserId));
  const missing = localised.slice(fromIndex);

  if (missing.length > 0) {
    yield* askEventDocValidateForeignTail(docId, localised, fromIndex);
  }

  for (const event of missing) {
    yield* askEventDocEventWrite(docId, event);
  }

  // Folded from the localised log so the summary's createdBy/updatedBy are local ids too. An unconditional put: an
  // import may have rewritten the log, which is the one case the row must be allowed to move backwards.
  const summary = foldEventDocSummary(localised);
  yield* askValidateModelOrThrowError(summary, eventDocSummaryViewSchema);
  yield* askEventDocUpsert(summary);

  if (missing.length > 0 || logRewritten) {
    // The hook receives the stored shape, which carries `type`.
    yield* askEventDocFireImportHooks(docId, localised, { ...summary, type });
  }

  return missing.length;
}
