import { ActionProcessorList, ActionProcessorListResolver, StoryResolver } from 'quidproquo-core';

import { useCallback, useContext, useEffect } from 'react';

import { useEffectCallback } from '../hooks/useEffectCallback';
import { useQpq } from '../hooks/useQpq';
import { useQpqStore } from '../store/useQpqStore';
import { getStateActionProcessor } from './actionProcessor';
import { ActionProcessorListResolverFactory } from './ActionProcessorListResolverFactory';
import { BubbleReducerDispatchContext } from './BubbleReducerDispatchContext';
import { QpqRuntimeDefinition } from './createQpqRuntimeDefinition';
import { getQpqRuntimeAreaKey } from './getQpqRuntimeAreaKey';
import { QpqApi } from './QpqMappedApi';

export type QpqAreaBinding<TState, TAction> = {
  subscribe: (listener: () => void) => () => void;
  getCurrentState: () => TState;
  dispatch: (action: TAction) => void;
  resolver: StoryResolver;
};

// Shared by every hook that reads an area (full runtime and selectors alike):
// all readers refcount the area and any of them can be the first bind that
// seeds initial state and runs onInit.
export function useQpqAreaBinding<TState, TAction, TApi extends QpqApi>(
  definition: QpqRuntimeDefinition<TState, TAction, TApi>,
  instanceName?: string,
  getActionProcessors?: ActionProcessorListResolverFactory<TState>,
): QpqAreaBinding<TState, TAction> {
  const store = useQpqStore();
  const areaKey = getQpqRuntimeAreaKey(definition, instanceName);

  // Before the bind effect fires (or after a late unbind) the area does not
  // exist yet; render against the definition's initial state.
  const getCurrentState = useEffectCallback((): TState =>
    store.hasArea(areaKey) ? (store.getAreaState(areaKey) as TState) : definition.initialState,
  );

  const parentDispatch = useContext(BubbleReducerDispatchContext);

  // Reduce with the module's reducer; handled effects publish the new state to
  // the store, unhandled ones bubble up the component tree.
  const dispatchThroughReducer = (action: TAction): void => {
    const [newState, handled] = definition.reducer(getCurrentState(), action);

    if (handled) {
      store.setAreaState(areaKey, newState);
    } else {
      parentDispatch(action);
    }
  };
  const dispatch = useEffectCallback(dispatchThroughReducer);

  // State processors always; then the definition's processors (needed by
  // onInit regardless of which binder runs it); then per-binding extras.
  const mergedProcessors: ActionProcessorListResolver = async (qpqConfig, dynamicModuleLoader) => {
    const resolvers = [
      getStateActionProcessor(dispatch, getCurrentState),
      definition.getActionProcessors?.(dispatch, getCurrentState),
      getActionProcessors?.(dispatch, getCurrentState),
    ];

    let processors: ActionProcessorList = {};
    for (const resolver of resolvers) {
      if (resolver) {
        processors = { ...processors, ...(await resolver(qpqConfig, dynamicModuleLoader)) };
      }
    }

    return processors;
  };

  const resolver = useQpq(mergedProcessors);

  const runInitStory = useEffectCallback(() => {
    if (definition.onInit) {
      resolver(definition.onInit)();
    }
  });

  // Identity must change with the area so useSyncExternalStore resubscribes.
  const subscribe = useCallback((listener: () => void) => store.subscribe(areaKey, listener), [store, areaKey]);

  useEffect(() => {
    const isFirstBind = store.bindArea(areaKey, definition.initialState);

    // A frozen store means devtools time travel: components popping in while
    // scrubbing must render the restored moment, not fetch the present.
    if (isFirstBind && !store.isFrozen()) {
      runInitStory();
    }

    return () => store.unbindArea(areaKey);
    // Rebind only when the target area changes; resolver or definition
    // identity churn must not unbind (and wipe) live state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, areaKey]);

  return { subscribe, getCurrentState, dispatch, resolver };
}
