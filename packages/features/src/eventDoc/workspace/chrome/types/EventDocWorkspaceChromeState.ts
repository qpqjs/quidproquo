import { Nullable } from 'quidproquo-core';

/** State of the default chrome slot. */
export type EventDocWorkspaceChromeState = {
  historyOpen: boolean;
  helpOpen: boolean;
  // Which slot the history panel shows.
  historySlotKey: Nullable<string>;
  // Short-lived links to assets the history panel shows (e.g. an adopted signature), by asset id.
  historyAssetUrls: Record<string, string>;
};

/** Initial chrome state. */
export const createInitialEventDocWorkspaceChromeState = (): EventDocWorkspaceChromeState => ({
  historyOpen: false,
  helpOpen: false,
  historySlotKey: null,
  historyAssetUrls: {},
});
