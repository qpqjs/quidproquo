import { AskResponse, askUserDirectoryRefreshToken, AuthenticateUserResponse } from 'quidproquo-core';

import { askGetAuthUserDirectoryName } from './askGetAuthUserDirectoryName';

export function* askRefreshToken(refreshToken: string): AskResponse<AuthenticateUserResponse> {
  const userDirectoryName = yield* askGetAuthUserDirectoryName();

  const authResponse = yield* askUserDirectoryRefreshToken(userDirectoryName, refreshToken);

  return authResponse;
}
