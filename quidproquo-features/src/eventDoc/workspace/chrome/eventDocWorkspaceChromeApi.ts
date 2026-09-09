import { askChromeSetHelpOpen } from './actionCreators/askChromeSetHelpOpen';
import { askChromeSetHistoryOpen } from './actionCreators/askChromeSetHistoryOpen';
import { askChromeSetHistorySlotKey } from './actionCreators/askChromeSetHistorySlotKey';

/** The chrome slot's api surface. */
export const eventDocWorkspaceChromeApi = {
  askChromeSetHistoryOpen,
  askChromeSetHelpOpen,
  askChromeSetHistorySlotKey,
};
