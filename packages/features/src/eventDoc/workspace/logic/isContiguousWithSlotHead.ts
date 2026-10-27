import { EventDocEvent } from '../../models';
import { EventDocWorkspaceState } from '../types/EventDocWorkspaceState';
import { getSlotHeadEventId } from './getSlotHeadEventId';

/**
 * Whether saved events can be appended to the slot's history without a gap: the first one must be the head plus one
 * (event 0 for an empty slot). An empty batch is trivially contiguous. A gap means another writer landed events this
 * slot has not seen, so the caller must resync rather than append.
 */
export const isContiguousWithSlotHead = (state: EventDocWorkspaceState, slotKey: string, events: EventDocEvent[]): boolean => {
  const first = events[0];

  if (!first) {
    return true;
  }

  const head = getSlotHeadEventId(state, slotKey);

  return first.payload.metadata.eventId === (head ?? -1) + 1;
};
