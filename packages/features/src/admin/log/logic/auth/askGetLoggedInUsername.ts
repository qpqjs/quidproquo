import { AskResponse, askUserDirectoryReadAccessToken } from 'quidproquo-core';

export function* askGetLoggedInUsername(): AskResponse<string> {
  const decodedAccessToken = yield* askUserDirectoryReadAccessToken('qpq-admin', false);

  return decodedAccessToken.username;
}
