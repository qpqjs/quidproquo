import { Nullable } from 'quidproquo-core';

import { EventDocEvent } from '../../models';
import { EventDocWorkspaceSlotError } from './EventDocWorkspaceSlotError';
import { EventDocWorkspaceSlotFoldsConfig } from './EventDocWorkspaceSlotFoldsConfig';
import { EventDocWorkspaceSlotState } from './EventDocWorkspaceSlotState';
import { EventDocWorkspaceSlotViewOf } from './EventDocWorkspaceSlotViewOf';
import { EventDocWorkspaceState } from './EventDocWorkspaceState';

/** A selector over the workspace state. */
export type EventDocWorkspaceSelector<T> = (state: EventDocWorkspaceState) => T;

/** The keyed per-slot selectors and workspace aggregates; constrained to fold configs so it needs no api. */
export type EventDocWorkspaceSelectors<TSlots extends EventDocWorkspaceSlotFoldsConfig> = {
  // The persistable log: [...history, ...pending], transients excluded.
  liveEvents: { [K in keyof TSlots]: EventDocWorkspaceSelector<EventDocEvent[]> };
  // The memoized live fold (history + pending + transients), migrated to latest.
  view: { [K in keyof TSlots]: EventDocWorkspaceSelector<EventDocWorkspaceSlotViewOf<TSlots[K]>> };
  slotState: { [K in keyof TSlots]: EventDocWorkspaceSelector<EventDocWorkspaceSlotState> };
  // isDirty and isSaving consider document slots only.
  isDirty: EventDocWorkspaceSelector<boolean>;
  isLoading: EventDocWorkspaceSelector<boolean>;
  isSaving: EventDocWorkspaceSelector<boolean>;
  // First non-null slot error.
  error: EventDocWorkspaceSelector<Nullable<EventDocWorkspaceSlotError>>;
};
