import { AskResponse, askUserDirectorySignOutUser } from '@qpqjs/core';

// Revokes every refresh token for the owner of this access token (server-side session
// kill). Cognito's GlobalSignOut is authorized by the access token itself, so no user
// directory name is needed here.
export function* askAuthSignOut(accessToken: string): AskResponse<void> {
  yield* askUserDirectorySignOutUser(accessToken);
}
