import { Nullable } from 'quidproquo-core';

import { useRef, useSyncExternalStore } from 'react';

import { useEffectCallback } from '../hooks/useEffectCallback';
import { QpqRuntimeComputed } from './createQpqRuntimeComputed';
import { useQpqAreaBinding } from './useQpqAreaBinding';

type SliceCacheEntry<TState, TSlice> = {
  state: TState;
  slice: TSlice;
};

export function useQpqRuntimeComputed<TState, TSlice>(computed: QpqRuntimeComputed<TState, TSlice>, instanceName?: string): TSlice {
  const { subscribe, getCurrentState } = useQpqAreaBinding(computed.definition, instanceName);

  const sliceCache = useRef<Nullable<SliceCacheEntry<TState, TSlice>>>(null);

  // The snapshot returns a referentially stable slice so the component only
  // re-renders when its slice actually changes, not on every area update.
  const computeStableSlice = (): TSlice => {
    const state = getCurrentState();
    const cached = sliceCache.current;

    if (cached && Object.is(cached.state, state)) {
      return cached.slice;
    }

    const slice = computed.compute(state);
    const stableSlice = cached && Object.is(cached.slice, slice) ? cached.slice : slice;

    sliceCache.current = { state, slice: stableSlice };
    return stableSlice;
  };
  const getSlice = useEffectCallback(computeStableSlice);

  return useSyncExternalStore(subscribe, getSlice, getSlice);
}
