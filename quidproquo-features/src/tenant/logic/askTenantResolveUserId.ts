import { AskResponse, askThrowError, askUserDirectoryReadAccessToken, ErrorTypeEnum } from 'quidproquo-core';

import { askEventDocResolveUserId } from '../../eventDoc/globals/askEventDocResolveUserId';

/** The caller's user id. eventDoc-bridged routes resolve it off the store's user-directory global; custom routes pass their directory in. */
export function* askTenantResolveUserId(userDirectoryName?: string): AskResponse<string> {
  if (!userDirectoryName) {
    return yield* askEventDocResolveUserId();
  }

  const token = yield* askUserDirectoryReadAccessToken(userDirectoryName, false);

  if (!token?.userId) {
    return yield* askThrowError(ErrorTypeEnum.Unauthorized, 'User not authenticated');
  }

  return token.userId;
}
