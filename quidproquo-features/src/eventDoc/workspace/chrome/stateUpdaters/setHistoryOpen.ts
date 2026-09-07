import { EventDocEventPayload } from '../../../models';
import { EventDocWorkspaceChromeSetHistoryOpenPayload } from '../effects/EventDocWorkspaceChromeSetHistoryOpenEffect';
import { EventDocWorkspaceChromeState } from '../types/EventDocWorkspaceChromeState';

/** Folds a SetHistoryOpen event. */
export const setHistoryOpen = (
  state: EventDocWorkspaceChromeState,
  payload: EventDocEventPayload<EventDocWorkspaceChromeSetHistoryOpenPayload>,
): EventDocWorkspaceChromeState => ({
  ...state,
  historyOpen: payload.data.open,
});
