import { AskResponse, askUserDirectoryAuthenticateUser, AuthenticateUserResponse } from '@qpqjs/core';

import { askAuthGetUserDirectoryName } from './askAuthGetUserDirectoryName';

export function* askAuthLogin(email: string, password: string): AskResponse<AuthenticateUserResponse> {
  const userDirectoryName = yield* askAuthGetUserDirectoryName();

  const authResponse = yield* askUserDirectoryAuthenticateUser(userDirectoryName, false, email, password);

  return authResponse;
}
