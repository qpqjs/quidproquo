import { AnyAuthChallenge, AskResponse, askUserDirectoryRespondToAuthChallenge, AuthenticateUserResponse } from 'quidproquo-core';

import { askGetAuthUserDirectoryName } from './askGetAuthUserDirectoryName';

export function* askRespondToAuthChallenge(authChallenge: AnyAuthChallenge): AskResponse<AuthenticateUserResponse> {
  const userDirectoryName = yield* askGetAuthUserDirectoryName();

  return yield* askUserDirectoryRespondToAuthChallenge(userDirectoryName, authChallenge);
}
