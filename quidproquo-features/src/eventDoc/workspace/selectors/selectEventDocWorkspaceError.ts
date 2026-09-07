import { Nullable } from 'quidproquo-core';

import { EventDocWorkspaceSlotError } from '../types/EventDocWorkspaceSlotError';
import { EventDocWorkspaceState } from '../types/EventDocWorkspaceState';

/** First non-null slot error, typed so the consumer owns the phrasing. */
export const selectEventDocWorkspaceError = (state: EventDocWorkspaceState): Nullable<EventDocWorkspaceSlotError> =>
  Object.values(state.slots)
    .map((slotState) => slotState.error)
    .find((slotError) => slotError !== null) ?? null;
