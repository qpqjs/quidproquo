import { Story } from 'quidproquo-core';

import { ActionProcessorListResolverFactory } from './ActionProcessorListResolverFactory';
import { QpqBubbleReducer } from './QpqBubbleReducer';
import { QpqApi } from './QpqMappedApi';

export type QpqRuntimeDefinition<TState, TAction, TApi extends QpqApi> = {
  // Area key prefix in the qpq store. Names are the sharing contract:
  // federated modules that bind the same name share the same state, so
  // namespace it to your app ('qpq/admin/auth', 'shell/tabLayout').
  uniqueName: string;
  api: TApi;
  initialState: TState;
  reducer: QpqBubbleReducer<TState, TAction>;

  // Runs once per area, on the first bind (count 0 -> 1), never on later binds.
  onInit?: Story<any, any>;

  // Extra processors every binder of this runtime gets. Processors the onInit
  // story needs belong here, not on the hook: React fires child effects before
  // parent ones, so any binder in the tree can be the one that runs onInit.
  getActionProcessors?: ActionProcessorListResolverFactory<TState>;
};

export type QpqRuntimeDefinitionOptions<TState, TAction, TApi extends QpqApi> = Omit<QpqRuntimeDefinition<TState, TAction, TApi>, 'reducer'> & {
  reducer?: QpqBubbleReducer<TState, TAction>;
};

// Everything bubbles when no reducer is given, so a definition can exist just
// to name an area and expose an api.
const bubbleEverythingReducer = <TState, TAction>(state: TState, _action: TAction): [TState, boolean] => [state, false];

export function createQpqRuntimeDefinition<TState, TAction, TApi extends QpqApi>(
  options: QpqRuntimeDefinitionOptions<TState, TAction, TApi>,
): QpqRuntimeDefinition<TState, TAction, TApi> {
  return {
    reducer: bubbleEverythingReducer,
    ...options,
  };
}
