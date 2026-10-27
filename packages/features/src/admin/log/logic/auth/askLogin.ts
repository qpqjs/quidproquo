import { AskResponse, askUserDirectoryAuthenticateUser, AuthenticateUserResponse } from 'quidproquo-core';

export function* askLogin(email: string, password: string): AskResponse<AuthenticateUserResponse> {
  const authResponse = yield* askUserDirectoryAuthenticateUser('qpq-admin', false, email, password);

  return authResponse;
}
