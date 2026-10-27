import { AskResponse, askUserDirectoryRevokeRefreshToken } from 'quidproquo-core';

import { askGetAuthUserDirectoryName } from './askGetAuthUserDirectoryName';

// Revokes a single session by its refresh token (Cognito RevokeToken) — "log out this
// device". Other sessions for the same user are unaffected (contrast askSignOut, which is
// a global sign-out of every session).
export function* askRevokeSession(refreshToken: string): AskResponse<void> {
  const userDirectoryName = yield* askGetAuthUserDirectoryName();

  yield* askUserDirectoryRevokeRefreshToken(userDirectoryName, refreshToken);
}
