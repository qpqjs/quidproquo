import { EventDocEvent } from '../../models';
import { noEvents } from '../constants/noEvents';
import { EventDocWorkspaceState } from '../types/EventDocWorkspaceState';

/** The slot's held saved log (the events after its fold base). */
export const getSlotHistory = (state: EventDocWorkspaceState, slotKey: string): EventDocEvent[] => state.history[slotKey] ?? noEvents;
