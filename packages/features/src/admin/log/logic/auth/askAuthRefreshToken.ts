import { AskResponse, askUserDirectoryRefreshToken, AuthenticateUserResponse } from '@qpqjs/core';

import { ADMIN_USER_DIRECTORY_NAME } from '../../../constants';

export function* askAuthRefreshToken(refreshToken: string): AskResponse<AuthenticateUserResponse> {
  const authResponse = yield* askUserDirectoryRefreshToken(ADMIN_USER_DIRECTORY_NAME, refreshToken);

  return authResponse;
}
