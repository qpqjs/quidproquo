import { AskResponse, askUserDirectoryRefreshToken, AuthenticateUserResponse } from '@qpqjs/core';

export function* askRefreshToken(refreshToken: string): AskResponse<AuthenticateUserResponse> {
  const authResponse = yield* askUserDirectoryRefreshToken('qpq-admin', refreshToken);

  return authResponse;
}
