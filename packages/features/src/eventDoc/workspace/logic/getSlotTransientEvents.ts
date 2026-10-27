import { EventDocEvent } from '../../models';
import { noEvents } from '../constants/noEvents';
import { EventDocWorkspaceState } from '../types/EventDocWorkspaceState';

const byCreatedAt = (a: EventDocEvent, b: EventDocEvent): number => a.payload.metadata.createdAt.localeCompare(b.payload.metadata.createdAt);

/**
 * One slot's transient events across all transientKeys, ordered by createdAt. Returns the shared noEvents reference when
 * empty so memo keys stay stable.
 */
export const getSlotTransientEvents = (state: EventDocWorkspaceState, slotKey: string): EventDocEvent[] => {
  const slotTransient = state.transient[slotKey] ?? {};
  // Keys sorted so the merge (and the stable sort's tie-break) does not depend on insertion order.
  const merged = Object.keys(slotTransient)
    .sort()
    .flatMap((transientKey) => slotTransient[transientKey]);

  if (merged.length === 0) {
    return noEvents;
  }

  // merged is a fresh array, so sorting in place is safe.
  return merged.sort(byCreatedAt);
};
