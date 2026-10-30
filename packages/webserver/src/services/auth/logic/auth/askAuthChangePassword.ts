import { AskResponse, askUserDirectoryChangePassword } from '@qpqjs/core';

// The underlying action authenticates the caller via their access token, so no
// user directory name is required here.
export function* askAuthChangePassword(oldPassword: string, newPassword: string, accessToken: string): AskResponse<void> {
  yield* askUserDirectoryChangePassword(oldPassword, newPassword, accessToken);
}
