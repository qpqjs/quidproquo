import { EventDocEvent } from '../../models';
import { EventDocWorkspaceState } from '../types/EventDocWorkspaceState';
import { getSlotHistory } from './getSlotHistory';
import { getSlotPending } from './getSlotPending';

/**
 * [...history, ...pending] for one slot: everything since the fold base, not the whole log. Transients are excluded because
 * they never save. Unmemoized.
 */
export const getSlotLiveEvents = (state: EventDocWorkspaceState, slotKey: string): EventDocEvent[] => [
  ...getSlotHistory(state, slotKey),
  ...getSlotPending(state, slotKey),
];
