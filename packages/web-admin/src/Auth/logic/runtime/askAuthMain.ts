import { AskResponse } from 'quidproquo-core';

import { askRunRefreshTokensLoop } from './askRunRefreshTokensLoop';

// No token restore on boot: tokens are in-memory only, so a page refresh
// always lands on the login screen and starts a fresh admin session.
export function* askAuthMain(): AskResponse<void> {
  yield* askRunRefreshTokensLoop();
}
