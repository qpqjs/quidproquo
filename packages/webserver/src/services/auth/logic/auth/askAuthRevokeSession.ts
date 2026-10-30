import { AskResponse, askUserDirectoryRevokeRefreshToken } from '@qpqjs/core';

import { askAuthGetUserDirectoryName } from './askAuthGetUserDirectoryName';

// Revokes a single session by its refresh token (Cognito RevokeToken), "log out this
// device". Other sessions for the same user are unaffected (contrast askAuthSignOut, which is
// a global sign-out of every session).
export function* askAuthRevokeSession(refreshToken: string): AskResponse<void> {
  const userDirectoryName = yield* askAuthGetUserDirectoryName();

  yield* askUserDirectoryRevokeRefreshToken(userDirectoryName, refreshToken);
}
