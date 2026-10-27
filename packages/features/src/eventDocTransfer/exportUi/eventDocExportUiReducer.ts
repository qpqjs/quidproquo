import { buildEffectReducer } from 'quidproquo-core';

import { EventDocExportUiEffect } from './effects/EventDocExportUiEffect';
import type { EventDocExportUiEffects } from './effects/EventDocExportUiEffects';
import { open } from './stateUpdaters/open';
import { reset } from './stateUpdaters/reset';
import { setCandidates } from './stateUpdaters/setCandidates';
import { setError } from './stateUpdaters/setError';
import { setExporting } from './stateUpdaters/setExporting';
import { setLoading } from './stateUpdaters/setLoading';
import { setManifest } from './stateUpdaters/setManifest';
import { setResult } from './stateUpdaters/setResult';
import { toggleSelected } from './stateUpdaters/toggleSelected';
import type { EventDocExportUiState } from './types/EventDocExportUiState';

/** Reducer for the export dialog state. */
export const eventDocExportUiReducer = buildEffectReducer<EventDocExportUiState, EventDocExportUiEffects>({
  [EventDocExportUiEffect.Open]: open,
  [EventDocExportUiEffect.SetCandidates]: setCandidates,
  [EventDocExportUiEffect.ToggleSelected]: toggleSelected,
  [EventDocExportUiEffect.SetLoading]: setLoading,
  [EventDocExportUiEffect.SetManifest]: setManifest,
  [EventDocExportUiEffect.SetExporting]: setExporting,
  [EventDocExportUiEffect.SetResult]: setResult,
  [EventDocExportUiEffect.SetError]: setError,
  [EventDocExportUiEffect.Reset]: reset,
});
