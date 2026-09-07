import { AskResponse, createDynamicFunctionCaller } from 'quidproquo-core';

import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EventDocInvokableFunctions } from '../definition/types/EventDocInvokableFunctions';
import { EventDocEvent } from '../models';
import { askEventDocValidateAppend } from './askEventDocValidateAppend';

/**
 * Validate a run of consecutive events, each against the state its predecessors fold to. The first rejection
 * throws Invalid.
 */
export function* askEventDocValidateAppendRun(events: EventDocEvent[], state: unknown): AskResponse<void> {
  const { storeName, type } = yield* askEventDocResolveStore();
  const functionsCaller = createDynamicFunctionCaller<EventDocInvokableFunctions>(eventDocFunctionsName(storeName, type));

  let current = state;

  for (const event of events) {
    yield* askEventDocValidateAppend(event, current);
    current = yield* functionsCaller.foldDocumentState([event], current);
  }
}
