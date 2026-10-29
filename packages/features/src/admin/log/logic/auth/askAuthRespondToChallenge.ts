import { AskResponse, askUserDirectoryRespondToAuthChallenge, AuthenticateUserChallenge, AuthenticateUserResponse } from '@qpqjs/core';

import { ADMIN_USER_DIRECTORY_NAME } from '../../../constants';

export function* askAuthRespondToChallenge(
  username: string,
  challenge: AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED,
  session: string,
  newPassword: string,
): AskResponse<AuthenticateUserResponse> {
  const response = yield* askUserDirectoryRespondToAuthChallenge(ADMIN_USER_DIRECTORY_NAME, {
    username,
    challenge,
    session,
    newPassword,
  });

  return response;
}
