import { EventDocWorkspaceAppendHistoryEventsPayload } from '../../effects/EventDocWorkspaceAppendHistoryEventsEffect';
import { EventDocWorkspaceSlotFoldsConfig } from '../../types/EventDocWorkspaceSlotFoldsConfig';
import { EventDocWorkspaceState } from '../../types/EventDocWorkspaceState';
import { appendSlotHistoryEvents } from './appendSlotHistoryEvents';

/** A refresh tail: appends and folds only the fetched events. */
export const createAppendHistoryEventsUpdater =
  (slots: EventDocWorkspaceSlotFoldsConfig) =>
  (state: EventDocWorkspaceState, { slotKey, events }: EventDocWorkspaceAppendHistoryEventsPayload): EventDocWorkspaceState =>
    appendSlotHistoryEvents(slots, state, slotKey, events);
