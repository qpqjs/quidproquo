import { Nullable } from 'quidproquo-core';

/** State of the default chrome slot. */
export type EventDocWorkspaceChromeState = {
  historyOpen: boolean;
  helpOpen: boolean;
  // Which slot the history panel shows.
  historySlotKey: Nullable<string>;
};

/** Initial chrome state. */
export const createInitialEventDocWorkspaceChromeState = (): EventDocWorkspaceChromeState => ({
  historyOpen: false,
  helpOpen: false,
  historySlotKey: null,
});
