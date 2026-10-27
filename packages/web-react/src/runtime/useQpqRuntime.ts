import { useMemo, useState, useSyncExternalStore } from 'react';

import { ActionProcessorListResolverFactory } from './ActionProcessorListResolverFactory';
import { QpqRuntimeDefinition } from './createQpqRuntimeDefinition';
import { QpqApi, QpqMappedApi } from './QpqMappedApi';
import { useQpqAreaBinding } from './useQpqAreaBinding';

export function useQpqRuntime<TState, TAction, TApi extends QpqApi>(
  definition: QpqRuntimeDefinition<TState, TAction, TApi>,
  instanceName?: string,
  getActionProcessors?: ActionProcessorListResolverFactory<TState>,
): [QpqMappedApi<TApi>, TState, (action: TAction) => void] {
  const { subscribe, getCurrentState, dispatch, resolver } = useQpqAreaBinding(definition, instanceName, getActionProcessors);

  const state = useSyncExternalStore(subscribe, getCurrentState, getCurrentState);

  // Api generators are memoized to prevent unnecessary re-renders.
  const [memoedApiGenerators] = useState(() => definition.api);

  // Wrap and remap each API generator using the resolver.
  const api = useMemo(() => {
    const wrapped: Record<string, any> = {};
    for (const key in memoedApiGenerators) {
      if (Object.prototype.hasOwnProperty.call(memoedApiGenerators, key)) {
        // Remove the 'ask' prefix and lower-case the first character.
        const withoutAsk = key.slice(3); // e.g., "FetchTodos"
        const newKey = withoutAsk.charAt(0).toLowerCase() + withoutAsk.slice(1); // "fetchTodos"
        // We know newKey matches our mapped type so we can assign.
        // (A type assertion is used here to quiet the compiler.)
        wrapped[newKey] = resolver(memoedApiGenerators[key as any]) as any;
      }
    }
    return wrapped;
  }, [resolver, memoedApiGenerators]);

  return [api as QpqMappedApi<TApi>, state, dispatch];
}
