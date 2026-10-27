import { AskResponse, askUserDirectoryConfirmForgotPassword, AuthenticateUserResponse } from 'quidproquo-core';

import { askGetAuthUserDirectoryName } from './askGetAuthUserDirectoryName';

export function* askConfirmForgotPassword(username: string, code: string, password: string): AskResponse<AuthenticateUserResponse> {
  const userDirectoryName = yield* askGetAuthUserDirectoryName();

  const response = yield* askUserDirectoryConfirmForgotPassword(userDirectoryName, code, username, password);

  return response;
}
