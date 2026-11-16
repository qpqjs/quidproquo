import { AskResponse, createDynamicFunctionCaller } from '@qpqjs/core';

import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { EventDocInvokableFunctions } from '../definition/types/EventDocInvokableFunctions';
import { eventDocBaseFunctions } from '../summary/eventDocBaseFunctions';
import { askEventDocFunctionsCallOrBase } from './askEventDocFunctionsCallOrBase';

/**
 * The current collection's list views, the summary first, read off its registered definition. A collection with no
 * registered definition has only the summary. `functionsName` overrides the registry name derived from the store
 * context (the projector is handed its name by config).
 */
export function* askEventDocListViewNamesResolve(functionsName?: string): AskResponse<string[]> {
  const { storeName, type } = yield* askEventDocStoreReadOrThrow();
  const functionsCaller = createDynamicFunctionCaller<EventDocInvokableFunctions>(functionsName ?? eventDocFunctionsName(storeName, type));

  return yield* askEventDocFunctionsCallOrBase(functionsCaller.getListViewNames(), eventDocBaseFunctions.getListViewNames);
}
