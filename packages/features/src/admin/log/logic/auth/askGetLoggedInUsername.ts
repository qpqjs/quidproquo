import { AskResponse, askUserDirectoryReadAccessToken } from '@qpqjs/core';

import { ADMIN_USER_DIRECTORY_NAME } from '../../../constants';

export function* askGetLoggedInUsername(): AskResponse<string> {
  const decodedAccessToken = yield* askUserDirectoryReadAccessToken(ADMIN_USER_DIRECTORY_NAME, false);

  return decodedAccessToken.username;
}
