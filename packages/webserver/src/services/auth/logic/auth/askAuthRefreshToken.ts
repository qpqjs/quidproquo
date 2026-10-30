import { AskResponse, askUserDirectoryRefreshToken, AuthenticateUserResponse } from '@qpqjs/core';

import { askAuthGetUserDirectoryName } from './askAuthGetUserDirectoryName';

export function* askAuthRefreshToken(refreshToken: string): AskResponse<AuthenticateUserResponse> {
  const userDirectoryName = yield* askAuthGetUserDirectoryName();

  const authResponse = yield* askUserDirectoryRefreshToken(userDirectoryName, refreshToken);

  return authResponse;
}
