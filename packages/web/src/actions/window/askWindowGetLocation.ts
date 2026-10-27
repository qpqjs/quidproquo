import { createActionRequester } from 'quidproquo-core';

import { WindowActionType } from './WindowActionType';

// A plain, serializable copy of the browser `window.location`.
export type WindowLocation = {
  href: string;
  origin: string;
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
};

/** Reads the current `window.location` as a plain serializable snapshot (never the live Location object). */
export const askWindowGetLocation = createActionRequester<WindowLocation>()({
  actionType: WindowActionType.GetLocation,
});
