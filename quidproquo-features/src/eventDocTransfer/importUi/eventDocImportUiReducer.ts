import { buildEffectReducer } from 'quidproquo-core';

import { EventDocImportUiEffect } from './effects/EventDocImportUiEffect';
import type { EventDocImportUiEffects } from './effects/EventDocImportUiEffects';
import { reset } from './stateUpdaters/reset';
import { setApplying } from './stateUpdaters/setApplying';
import { setError } from './stateUpdaters/setError';
import { setLoading } from './stateUpdaters/setLoading';
import { setPlan } from './stateUpdaters/setPlan';
import { setResult } from './stateUpdaters/setResult';
import type { EventDocImportUiState } from './types/EventDocImportUiState';

/** Reducer for the import screen state. */
export const eventDocImportUiReducer = buildEffectReducer<EventDocImportUiState, EventDocImportUiEffects>({
  [EventDocImportUiEffect.SetLoading]: setLoading,
  [EventDocImportUiEffect.SetPlan]: setPlan,
  [EventDocImportUiEffect.SetApplying]: setApplying,
  [EventDocImportUiEffect.SetResult]: setResult,
  [EventDocImportUiEffect.SetError]: setError,
  [EventDocImportUiEffect.Reset]: reset,
});
