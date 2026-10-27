import { AskResponse, askUserDirectoryRespondToAuthChallenge, AuthenticateUserChallenge, AuthenticateUserResponse } from 'quidproquo-core';

export function* askRespondToAuthChallenge(
  username: string,
  challenge: AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED,
  session: string,
  newPassword: string,
): AskResponse<AuthenticateUserResponse> {
  const response = yield* askUserDirectoryRespondToAuthChallenge('qpq-admin', {
    username,
    challenge,
    session,
    newPassword,
  });

  return response;
}
