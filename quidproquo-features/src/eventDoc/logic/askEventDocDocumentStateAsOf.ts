import { AskResponse, createDynamicFunctionCaller, Nullable } from 'quidproquo-core';

import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { askEventDocEventListAll } from '../data/askEventDocEventListAll';
import { askEventDocSnapshotBaseLatest } from '../data/askEventDocSnapshotBaseLatest';
import { EventDocInvokableFunctions } from '../definition/types/EventDocInvokableFunctions';
import { EventDocDocumentStateAtEvent } from '../models';

export type EventDocDocumentStateAsOfOptions = {
  // Read the writer's own most recent appends — for a caller deriving state that MUST
  // include an event it just wrote (the append hooks). Reads default to eventually
  // consistent: a stale replica surfaces an older base / shorter gap for the same answer.
  consistentRead?: boolean;
};

/**
 * THE backend state read: the document view as of `upToEventId`, latest-shaped, at the
 * cost of the gap since the newest snapshot — never the whole log. Seeds from the
 * snapshot store's document view at-or-before the target and folds only the events
 * between, through the collection's registered `foldDocumentState` (which migrates to
 * the current schema at the end). No usable snapshot just means the gap IS the prefix.
 *
 * Null when the log is empty up to the target (no snapshot, no events) — there is no
 * document to have a state. Throws the dynamic-functions missing error for a collection
 * with no registered definition; call sites that serve such collections map it to their
 * own not-configured behaviour (isEventDocFunctionsMissing).
 */
export function* askEventDocDocumentStateAsOf(
  modelId: string,
  upToEventId: number,
  options?: EventDocDocumentStateAsOfOptions,
): AskResponse<Nullable<EventDocDocumentStateAtEvent>> {
  const { storeName, type } = yield* askEventDocResolveStore();
  const functionsCaller = createDynamicFunctionCaller<EventDocInvokableFunctions>(eventDocFunctionsName(storeName, type));

  const base = yield* askEventDocSnapshotBaseLatest(modelId, upToEventId);

  // A base AT the target still goes through foldDocumentState with an empty gap — that
  // is what migrates the era-pinned stored state up to the current schema.
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
