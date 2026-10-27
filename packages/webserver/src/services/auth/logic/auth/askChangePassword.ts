import { AskResponse, askUserDirectoryChangePassword } from 'quidproquo-core';

// The underlying action authenticates the caller via their access token, so no
// user directory name is required here.
export function* askChangePassword(oldPassword: string, newPassword: string, accessToken: string): AskResponse<void> {
  yield* askUserDirectoryChangePassword(oldPassword, newPassword, accessToken);
}
