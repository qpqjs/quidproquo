import { AskResponse, createDynamicFunctionCaller, Nullable } from 'quidproquo-core';

import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { askEventDocEventListAll } from '../data/askEventDocEventListAll';
import { askEventDocSnapshotBaseLatest } from '../data/askEventDocSnapshotBaseLatest';
import { EventDocInvokableFunctions } from '../definition/types/EventDocInvokableFunctions';
import { EventDocDocumentStateAtEvent } from '../models';

/** Options for the snapshot-seeded state reads. */
export type EventDocDocumentStateAsOfOptions = {
  // Required when the caller must see an event it just wrote (the append hooks); reads default to eventually consistent.
  consistentRead?: boolean;
};

/**
 * The document state as of `upToEventId`: seeds from the newest snapshot at or before the target and folds only
 * the events after it. Null when the log is empty up to the target. Throws the dynamic-functions missing error
 * for a collection with no registered definition (see isEventDocFunctionsMissing).
 */
export function* askEventDocDocumentStateAsOf(
  modelId: string,
  upToEventId: number,
  options?: EventDocDocumentStateAsOfOptions,
): AskResponse<Nullable<EventDocDocumentStateAtEvent>> {
  const { storeName, type } = yield* askEventDocResolveStore();
  const functionsCaller = createDynamicFunctionCaller<EventDocInvokableFunctions>(eventDocFunctionsName(storeName, type));

  const base = yield* askEventDocSnapshotBaseLatest(modelId, upToEventId);

  // A base at the target still goes through foldDocumentState with an empty gap: that migrates the stored state to the current schema.
  const gap =
    base?.eventId === upToEventId
      ? []
      : yield* askEventDocEventListAll(modelId, {
          afterEventId: base?.eventId,
          upToEventId,
          consistentRead: options?.consistentRead,
        });

  if (!base && gap.length === 0) {
    return null;
  }

  const state = yield* functionsCaller.foldDocumentState(gap, base?.state);

  return { eventId: upToEventId, state };
}
