import { AnyAuthChallenge, AskResponse, askUserDirectoryRespondToAuthChallenge, AuthenticateUserResponse } from '@qpqjs/core';

import { askAuthGetUserDirectoryName } from './askAuthGetUserDirectoryName';

export function* askAuthRespondToChallenge(authChallenge: AnyAuthChallenge): AskResponse<AuthenticateUserResponse> {
  const userDirectoryName = yield* askAuthGetUserDirectoryName();

  return yield* askUserDirectoryRespondToAuthChallenge(userDirectoryName, authChallenge);
}
