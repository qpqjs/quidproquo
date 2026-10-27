import { EventDocEventPayload } from '../../../models';
import { EventDocWorkspaceChromeSetHistorySlotKeyPayload } from '../effects/EventDocWorkspaceChromeSetHistorySlotKeyEffect';
import { EventDocWorkspaceChromeState } from '../types/EventDocWorkspaceChromeState';

/** Folds a SetHistorySlotKey event. */
export const setHistorySlotKey = (
  state: EventDocWorkspaceChromeState,
  payload: EventDocEventPayload<EventDocWorkspaceChromeSetHistorySlotKeyPayload>,
): EventDocWorkspaceChromeState => ({
  ...state,
  historySlotKey: payload.data.slotKey,
});
