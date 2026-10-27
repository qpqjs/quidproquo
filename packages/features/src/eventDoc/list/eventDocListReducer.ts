import { buildEffectReducer } from 'quidproquo-core';

import { EventDocListEffect } from './effects/EventDocListEffect';
import type { EventDocListEffects } from './effects/EventDocListEffects';
import { addItem } from './stateUpdaters/addItem';
import { pageLoaded } from './stateUpdaters/pageLoaded';
import { setConfig } from './stateUpdaters/setConfig';
import { setError } from './stateUpdaters/setError';
import { setLoading } from './stateUpdaters/setLoading';
import { setPageIndex } from './stateUpdaters/setPageIndex';
import { setPageSize } from './stateUpdaters/setPageSize';
import type { EventDocListState } from './types/EventDocListState';

/** Reducer for the event-doc list state. */
export const eventDocListReducer = buildEffectReducer<EventDocListState, EventDocListEffects>({
  [EventDocListEffect.SetConfig]: setConfig,
  [EventDocListEffect.PageLoaded]: pageLoaded,
  [EventDocListEffect.AddItem]: addItem,
  [EventDocListEffect.SetLoading]: setLoading,
  [EventDocListEffect.SetError]: setError,
  [EventDocListEffect.SetPageIndex]: setPageIndex,
  [EventDocListEffect.SetPageSize]: setPageSize,
});
