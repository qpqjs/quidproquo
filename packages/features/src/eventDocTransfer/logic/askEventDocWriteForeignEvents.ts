import { askCatch, askInlineFunctionExecute, AskResponse, askThrowError, createDynamicFunctionCaller, ErrorTypeEnum, Nullable } from '@qpqjs/core';

import { eventDocFunctionsName } from '../../eventDoc/constants/eventDocFunctionsName';
import { askEventDocStoreReadOrThrow } from '../../eventDoc/context';
import { askEventDocEventListAll, askEventDocEventWrite, askEventDocUpsert } from '../../eventDoc/data';
import { EventDocInvokableFunctions } from '../../eventDoc/definition/types/EventDocInvokableFunctions';
import { askEventDocHookStates } from '../../eventDoc/logic/askEventDocHookStates';
import { askEventDocValidateAppendRun } from '../../eventDoc/logic/askEventDocValidateAppendRun';
import { isEventDocFunctionsMissing } from '../../eventDoc/logic/isEventDocFunctionsMissing';
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

// The prefix the tail must follow. For a new doc that is the bundle's opening INIT_STATE, which seeds the state like a
// create does. Otherwise it is the target's own stored log: the fast-forward match is by event identity, not data, so a
// bundle's copy of the prefix is not trusted to fold to the state the real document holds.
function* askEventDocReadForeignPrefix(docId: string, events: EventDocEvent[], fromIndex: number): AskResponse<EventDocEvent[]> {
  if (fromIndex === 0) {
    return events.slice(0, 1);
  }

  const stored = yield* askEventDocEventListAll(docId, { consistentRead: true });

  if (stored.length < fromIndex) {
    return yield* askThrowError(
      ErrorTypeEnum.Conflict,
      `The document's log changed during the import: ${stored.length} events stored, ${fromIndex} expected.`,
    );
  }

  return stored.slice(0, fromIndex);
}

// The uploader is the bundle's only provenance, so the tail gets the append gate's validator and fold, each event
// against the state its predecessors fold to. The run starts after the prefix (see askEventDocReadForeignPrefix).
// A collection with no registered definition degrades to an unvalidated write, as an append does.
function* askEventDocValidateForeignTail(docId: string, events: EventDocEvent[], fromIndex: number): AskResponse<void> {
  const { storeName, type } = yield* askEventDocStoreReadOrThrow();
  const functionsCaller = createDynamicFunctionCaller<EventDocInvokableFunctions>(eventDocFunctionsName(storeName, type));

  const seedCount = Math.max(fromIndex, 1);
  const prefix = yield* askEventDocReadForeignPrefix(docId, events, fromIndex);
  const seed = yield* askCatch(functionsCaller.foldDocumentState(prefix));

  if (!seed.success) {
    if (isEventDocFunctionsMissing(seed.error.errorType)) {
      return;
    }

    return yield* askThrowError(seed.error.errorType, seed.error.errorText);
  }

  yield* askEventDocValidateAppendRun(events.slice(seedCount), seed.result);
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

  const localised = events.map((event) => toLocalActor(event, importerUserId));
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
