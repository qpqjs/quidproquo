import { Nullable, QpqReducer } from 'quidproquo-core';

import { EventDocEvent } from '../models';
import { EventDocWorkspaceChromeSlot } from './chrome/eventDocWorkspaceChromeSlot';
import { EventDocWorkspaceEffects } from './effects/EventDocWorkspaceEffects';
import { EventDocWorkspaceBuiltInApi } from './types/EventDocWorkspaceBuiltInApi';
import { EventDocWorkspaceSelector } from './types/EventDocWorkspaceSelectors';
import { EventDocWorkspaceSlotApiOf } from './types/EventDocWorkspaceSlotApiOf';
import { EventDocWorkspaceSlotError } from './types/EventDocWorkspaceSlotError';
import { EventDocWorkspaceSlotsConfig } from './types/EventDocWorkspaceSlotsConfig';
import { EventDocWorkspaceSlotState } from './types/EventDocWorkspaceSlotState';
import { EventDocWorkspaceSlotViewOf } from './types/EventDocWorkspaceSlotViewOf';
import { EventDocWorkspaceSnapshot } from './types/EventDocWorkspaceSnapshot';
import { EventDocWorkspaceState } from './types/EventDocWorkspaceState';

/** Adds the default `chrome` slot unless the definition supplies its own. */
export type EventDocWorkspaceResolvedSlots<TSlots extends EventDocWorkspaceSlotsConfig> = 'chrome' extends keyof TSlots
  ? TSlots
  : TSlots & { chrome: EventDocWorkspaceChromeSlot };

/**
 * One mounted doc: its bound api, `view` (the memoized live fold of history + pending + transients, migrated to latest),
 * `liveEvents` (the persistable log [...history, ...pending], transients excluded) and `slotState` (identity, loading, saving, error).
 */
export type EventDocWorkspaceDoc<TSlot> = {
  api: EventDocWorkspaceSlotApiOf<TSlot>;
  view: EventDocWorkspaceSelector<EventDocWorkspaceSlotViewOf<TSlot>>;
  liveEvents: EventDocWorkspaceSelector<EventDocEvent[]>;
  slotState: EventDocWorkspaceSelector<EventDocWorkspaceSlotState>;
};

/** Cross-doc aggregates. isDirty and isSaving consider document slots only; error is the first non-null slot error. */
export type EventDocWorkspaceAggregateSelectors = {
  isDirty: EventDocWorkspaceSelector<boolean>;
  isLoading: EventDocWorkspaceSelector<boolean>;
  isSaving: EventDocWorkspaceSelector<boolean>;
  error: EventDocWorkspaceSelector<Nullable<EventDocWorkspaceSlotError>>;
};

/**
 * What createEventDocWorkspace returns. createSnapshot captures identity, pending and history so api.askInit can restore
 * into another runtime of the same workspace.
 */
export type EventDocWorkspace<TSlots extends EventDocWorkspaceSlotsConfig> = {
  docs: { [K in keyof TSlots]: EventDocWorkspaceDoc<TSlots[K]> };
  api: EventDocWorkspaceBuiltInApi;
  reducer: QpqReducer<EventDocWorkspaceState, EventDocWorkspaceEffects>;
  createInitialState: () => EventDocWorkspaceState;
  createSnapshot: (state: EventDocWorkspaceState) => EventDocWorkspaceSnapshot;
  selectors: EventDocWorkspaceAggregateSelectors;
};
