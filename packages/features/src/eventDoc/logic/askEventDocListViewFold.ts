import { AskResponse, createDynamicFunctionCaller, Nullable } from '@qpqjs/core';

import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { EventDocInvokableFunctions } from '../definition/types/EventDocInvokableFunctions';
import { EventDocEvent, EventDocListViewState } from '../models';
import { eventDocBaseFunctions } from '../summary/eventDocBaseFunctions';
import { askEventDocFunctionsCallOrBase } from './askEventDocFunctionsCallOrBase';

/**
 * One list view's state after `events`, resumed from `seedState` (a lists store row's state, or null to fold from
 * scratch), by the collection's registered definition. A collection with none registered folds its summary with the
 * same reducer. Null when the view cannot be folded from its own row (see EventDocDefinition.foldListView).
 */
export function* askEventDocListViewFold(
  viewName: string,
  events: EventDocEvent[],
  seedState: Nullable<unknown>,
  trusted: boolean,
): AskResponse<Nullable<EventDocListViewState>> {
  const { storeName, type } = yield* askEventDocStoreReadOrThrow();
  const functionsCaller = createDynamicFunctionCaller<EventDocInvokableFunctions>(eventDocFunctionsName(storeName, type));

  return yield* askEventDocFunctionsCallOrBase(functionsCaller.foldListView(viewName, events, seedState, trusted), () =>
    eventDocBaseFunctions.foldListView(viewName, events, seedState, trusted),
  );
}
