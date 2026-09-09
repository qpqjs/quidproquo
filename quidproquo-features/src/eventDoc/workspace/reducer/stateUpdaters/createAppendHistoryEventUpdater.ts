import { EventDocWorkspaceAppendHistoryEventPayload } from '../../effects/EventDocWorkspaceAppendHistoryEventEffect';
import { EventDocWorkspaceSlotFoldsConfig } from '../../types/EventDocWorkspaceSlotFoldsConfig';
import { EventDocWorkspaceState } from '../../types/EventDocWorkspaceState';
import { appendSlotHistoryEvents } from './appendSlotHistoryEvents';

/** One save landing: appends and folds the server-stamped event. */
export const createAppendHistoryEventUpdater =
  (slots: EventDocWorkspaceSlotFoldsConfig) =>
  (state: EventDocWorkspaceState, { slotKey, event }: EventDocWorkspaceAppendHistoryEventPayload): EventDocWorkspaceState =>
    appendSlotHistoryEvents(slots, state, slotKey, [event]);
