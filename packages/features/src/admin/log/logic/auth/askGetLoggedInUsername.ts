import { AskResponse, askUserDirectoryReadAccessToken } from '@qpqjs/core';

export function* askGetLoggedInUsername(): AskResponse<string> {
  const decodedAccessToken = yield* askUserDirectoryReadAccessToken('qpq-admin', false);

  return decodedAccessToken.username;
}
