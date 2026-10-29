import { AskResponse, askUserDirectoryAuthenticateUser, AuthenticateUserResponse } from '@qpqjs/core';

import { ADMIN_USER_DIRECTORY_NAME } from '../../../constants';

export function* askAuthLogin(email: string, password: string): AskResponse<AuthenticateUserResponse> {
  const authResponse = yield* askUserDirectoryAuthenticateUser(ADMIN_USER_DIRECTORY_NAME, false, email, password);

  return authResponse;
}
