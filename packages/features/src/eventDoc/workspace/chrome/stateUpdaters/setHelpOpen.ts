import { EventDocEventPayload } from '../../../models';
import { EventDocWorkspaceChromeSetHelpOpenPayload } from '../effects/EventDocWorkspaceChromeSetHelpOpenEffect';
import { EventDocWorkspaceChromeState } from '../types/EventDocWorkspaceChromeState';

/** Folds a SetHelpOpen event. */
export const setHelpOpen = (
  state: EventDocWorkspaceChromeState,
  payload: EventDocEventPayload<EventDocWorkspaceChromeSetHelpOpenPayload>,
): EventDocWorkspaceChromeState => ({
  ...state,
  helpOpen: payload.data.open,
});
