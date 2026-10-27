import { buildMutableEffectReducer } from 'quidproquo-core';

import { SharedQueryParamsEffect, SharedQueryParamsEffects, SharedQueryParamsState } from './sharedQueryParamsTypes';

export const sharedQueryParamsInitalState: SharedQueryParamsState = {
  // No initial state
};

export const sharedQueryParamsReducer = buildMutableEffectReducer<SharedQueryParamsState, SharedQueryParamsEffects>({
  [SharedQueryParamsEffect.SetParam]: (state, { key, values }) => {
    state[key] = values;
  },
});
