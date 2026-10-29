import { buildMutableEffectReducer } from '@qpqjs/core';

import { SharedQueryParamsEffect, SharedQueryParamsEffects, SharedQueryParamsState } from './sharedQueryParamsTypes';

export const sharedQueryParamsInitialState: SharedQueryParamsState = {
  // No initial state
};

export const sharedQueryParamsReducer = buildMutableEffectReducer<SharedQueryParamsState, SharedQueryParamsEffects>({
  [SharedQueryParamsEffect.SetParam]: (state, { key, values }) => {
    state[key] = values;
  },
});
