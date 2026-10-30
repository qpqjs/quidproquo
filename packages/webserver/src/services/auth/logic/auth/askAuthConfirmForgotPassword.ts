import { AskResponse, askUserDirectoryConfirmForgotPassword, AuthenticateUserResponse } from '@qpqjs/core';

import { askAuthGetUserDirectoryName } from './askAuthGetUserDirectoryName';

export function* askAuthConfirmForgotPassword(username: string, code: string, password: string): AskResponse<AuthenticateUserResponse> {
  const userDirectoryName = yield* askAuthGetUserDirectoryName();

  const response = yield* askUserDirectoryConfirmForgotPassword(userDirectoryName, code, username, password);

  return response;
}
