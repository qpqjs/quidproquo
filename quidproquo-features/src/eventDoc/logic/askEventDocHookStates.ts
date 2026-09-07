import { askCatch, AskResponse, askThrowError, createDynamicFunctionCaller } from 'quidproquo-core';

import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { askEventDocEventListAll } from '../data/askEventDocEventListAll';
import { askEventDocSnapshotBaseLatest } from '../data/askEventDocSnapshotBaseLatest';
import { EventDocInvokableFunctions } from '../definition/types/EventDocInvokableFunctions';
import { foldEventDocBase } from '../fold/foldEventDocBase';
import { EventDocEvent } from '../models';
import { isEventDocFunctionsMissing } from './isEventDocFunctionsMissing';

/** The document state as of the triggering event and as of the event before it. */
export type EventDocHookStates = {
  state: unknown;
  previousState: unknown;
};

/**
 * The state pair a hook receives, derived from one snapshot-seeded gap read. Event reads are consistent because the
 * triggering event was written moments ago. A collection with no registered definition gets the reserved base fold instead.
 */
export function* askEventDocHookStates(modelId: string, event: EventDocEvent): AskResponse<EventDocHookStates> {
  const { storeName, type } = yield* askEventDocResolveStore();
  const functionsCaller = createDynamicFunctionCaller<EventDocInvokableFunctions>(eventDocFunctionsName(storeName, type));

  const eventId = event.payload.metadata.eventId;
  const base = yield* askEventDocSnapshotBaseLatest(modelId, eventId);

  // The gap ends at the triggering event, so previousState is the same gap minus its tail. A base already at the
  // event leaves nothing to subtract from, so the whole prefix is refolded instead.
  const gap =
    base && base.eventId !== eventId
      ? yield* askEventDocEventListAll(modelId, { afterEventId: base.eventId, upToEventId: eventId, consistentRead: true })
      : null;

  const seededGap = gap && gap.length > 0 ? gap : null;

  const events = seededGap ?? (yield* askEventDocEventListAll(modelId, { upToEventId: eventId, consistentRead: true }));
  const seedState = seededGap ? base?.state : undefined;

  const folded = yield* askCatch(functionsCaller.foldDocumentState(events, seedState));

  if (!folded.success) {
    if (!isEventDocFunctionsMissing(folded.error.errorType)) {
      return yield* askThrowError(folded.error.errorType, folded.error.errorText);
    }

    const prefix = seededGap ? yield* askEventDocEventListAll(modelId, { upToEventId: eventId, consistentRead: true }) : events;

    return {
      state: foldEventDocBase(prefix),
      previousState: foldEventDocBase(prefix.slice(0, -1)),
    };
  }

  const previousState = yield* functionsCaller.foldDocumentState(events.slice(0, -1), seedState);

  return { state: folded.result, previousState };
}
