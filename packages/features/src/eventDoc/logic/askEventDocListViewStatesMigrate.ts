import { AskResponse, createDynamicFunctionCaller } from '@qpqjs/core';

import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { EventDocInvokableFunctions } from '../definition/types/EventDocInvokableFunctions';
import { eventDocBaseFunctions } from '../summary/eventDocBaseFunctions';
import { askEventDocFunctionsCallOrBase } from './askEventDocFunctionsCallOrBase';

/**
 * Stored list view states climbed to the latest schema, in order, by the collection's registered definition: a row
 * holds its state as folded, and a reader gets the latest shape. A collection with none registered has only its
 * summary, which has one shape.
 */
export function* askEventDocListViewStatesMigrate(viewName: string, states: unknown[]): AskResponse<unknown[]> {
  const { storeName, type } = yield* askEventDocStoreReadOrThrow();
  const functionsCaller = createDynamicFunctionCaller<EventDocInvokableFunctions>(eventDocFunctionsName(storeName, type));

  return yield* askEventDocFunctionsCallOrBase(functionsCaller.migrateListViewStates(viewName, states), () =>
    eventDocBaseFunctions.migrateListViewStates(viewName, states),
  );
}
