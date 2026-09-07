import { AskResponse, createDynamicFunctionCaller } from 'quidproquo-core';

import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { askEventDocEventListAll } from '../data/askEventDocEventListAll';
import { EventDocInvokableFunctions } from '../definition/types/EventDocInvokableFunctions';
import { EventDocDocumentStateAtEvent } from '../models';

/**
 * Advance a state the caller already holds to the log's current head: read ONLY the events
 * after `base.eventId` (a consistent read, because the caller is racing a writer whose
 * event just landed) and fold them onto `base.state`. Never consults a snapshot and never
 * re-reads the prefix, so the cost is the handful of events that arrived since the base.
 *
 * This is the append loop's retry read: a lap that lost the slot race keeps the state it
 * validated against and folds just the winners on top before validating again. Returns
 * the base unchanged when nothing has landed since it.
 */
export function* askEventDocDocumentStateAdvance(modelId: string, base: EventDocDocumentStateAtEvent): AskResponse<EventDocDocumentStateAtEvent> {
  const { storeName, type } = yield* askEventDocResolveStore();
  const functionsCaller = createDynamicFunctionCaller<EventDocInvokableFunctions>(eventDocFunctionsName(storeName, type));

  const gap = yield* askEventDocEventListAll(modelId, { afterEventId: base.eventId, consistentRead: true });

  if (gap.length === 0) {
    return base;
  }

  const state = yield* functionsCaller.foldDocumentState(gap, base.state);

  return { eventId: gap[gap.length - 1].payload.metadata.eventId, state };
}
