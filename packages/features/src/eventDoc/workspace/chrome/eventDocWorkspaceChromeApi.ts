import { askEventDocWorkspaceChromeSetHelpOpen } from './actionCreators/askEventDocWorkspaceChromeSetHelpOpen';
import { askEventDocWorkspaceChromeSetHistoryAssetUrls } from './actionCreators/askEventDocWorkspaceChromeSetHistoryAssetUrls';
import { askEventDocWorkspaceChromeSetHistoryOpen } from './actionCreators/askEventDocWorkspaceChromeSetHistoryOpen';
import { askEventDocWorkspaceChromeSetHistorySlotKey } from './actionCreators/askEventDocWorkspaceChromeSetHistorySlotKey';

/** The chrome slot's api surface. */
export const eventDocWorkspaceChromeApi = {
  askEventDocWorkspaceChromeSetHistoryOpen,
  askEventDocWorkspaceChromeSetHelpOpen,
  askEventDocWorkspaceChromeSetHistorySlotKey,
  askEventDocWorkspaceChromeSetHistoryAssetUrls,
};
