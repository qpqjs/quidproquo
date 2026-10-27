import { Nullable } from '@qpqjs/core';

import { EventDocWorkspaceState } from '../types/EventDocWorkspaceState';
import { getSlotHistory } from './getSlotHistory';

/** The id of the last saved event the slot holds: its last history event, else its base; null for an empty slot. */
export const getSlotHeadEventId = (state: EventDocWorkspaceState, slotKey: string): Nullable<number> => {
  const history = getSlotHistory(state, slotKey);
  const lastEvent = history[history.length - 1];

  if (lastEvent) {
    return lastEvent.payload.metadata.eventId;
  }

  return state.bases[slotKey]?.eventId ?? null;
};
