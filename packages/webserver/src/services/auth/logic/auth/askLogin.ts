import { AskResponse, askUserDirectoryAuthenticateUser, AuthenticateUserResponse } from 'quidproquo-core';

import { askGetAuthUserDirectoryName } from './askGetAuthUserDirectoryName';

export function* askLogin(email: string, password: string): AskResponse<AuthenticateUserResponse> {
  const userDirectoryName = yield* askGetAuthUserDirectoryName();

  const authResponse = yield* askUserDirectoryAuthenticateUser(userDirectoryName, false, email, password);

  return authResponse;
}
