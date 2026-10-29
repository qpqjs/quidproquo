import { Story } from '@qpqjs/core';

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

  /**
   * The area's initial load. Runs once per area lifetime, on the bind that takes it from
   * no consumers to one, with the definition's processors; later binders join the live state
   * and never rerun it. The last unbind tears the area down, so a later remount is a new
   * lifetime and runs it again. Under devtools time travel (a frozen store) it is skipped,
   * so a component popping in while scrubbing renders the restored moment.
   *
   * This is where data that a screen needs on arrival is fetched: never in a `useEffect`.
   * A load that depends on a key (the selected id, a route param) is dispatched by the
   * story that changes that key, so the fetch and the state it fills travel together.
   */
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

/**
 * Declares a store area: its name, api, initial state, reducer and, through `onInit`, its
 * initial load. Components bind it with the runtime hooks and never load data themselves.
 *
 *   export const authRuntime = createQpqRuntimeDefinition({
 *     uniqueName: 'qpq/admin/auth',
 *     api: authLogic,
 *     initialState: authInitialState,
 *     reducer: authReducer,
 *     // runs once when the first component binds the area
 *     onInit: askAuthMain,
 *   });
 */
export function createQpqRuntimeDefinition<TState, TAction, TApi extends QpqApi>(
  options: QpqRuntimeDefinitionOptions<TState, TAction, TApi>,
): QpqRuntimeDefinition<TState, TAction, TApi> {
  return {
    reducer: bubbleEverythingReducer,
    ...options,
  };
}
