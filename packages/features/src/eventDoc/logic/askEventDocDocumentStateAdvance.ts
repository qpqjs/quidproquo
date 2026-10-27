import { AskResponse, createDynamicFunctionCaller } from 'quidproquo-core';

import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { askEventDocEventListAll } from '../data/askEventDocEventListAll';
import { EventDocInvokableFunctions } from '../definition/types/EventDocInvokableFunctions';
import { EventDocDocumentStateAtEvent } from '../models';

/**
 * Advance a state the caller already holds to the log's head by folding only the events after `base.eventId`
 * (consistent read: the caller is racing a writer whose event just landed). Returns the base unchanged when nothing landed.
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
