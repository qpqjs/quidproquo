import { EventDocWorkspaceChromeState } from '../types/EventDocWorkspaceChromeState';

/** Initial chrome state. */
export const createInitialEventDocWorkspaceChromeState = (): EventDocWorkspaceChromeState => ({
  historyOpen: false,
  helpOpen: false,
  historySlotKey: null,
  historyAssetUrls: {},
});
