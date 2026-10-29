import { buildEffectReducer } from '@qpqjs/core';

import { SharedQueryParamsEffect } from './effects/SharedQueryParamsEffect';
import { SharedQueryParamsEffects } from './effects/SharedQueryParamsEffects';
import { setParam } from './stateUpdaters/setParam';
import { SharedQueryParamsState } from './types/SharedQueryParamsState';

export const sharedQueryParamsReducer = buildEffectReducer<SharedQueryParamsState, SharedQueryParamsEffects>({
  [SharedQueryParamsEffect.SetParam]: setParam,
});
