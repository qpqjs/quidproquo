import { askConfigGetGlobal, AskResponse, askThrowError, askUserDirectoryReadAccessToken, ErrorTypeEnum } from 'quidproquo-core';

import { EVENT_DOC_USER_DIRECTORY_GLOBAL } from '../constants/eventDocGlobalNames';

/** Resolves the caller's user id from the request's access token; throws Unauthorized when there is none. */
export function* askEventDocResolveUserId(): AskResponse<string> {
  const userDirectory = yield* askConfigGetGlobal<string>(EVENT_DOC_USER_DIRECTORY_GLOBAL);

  const token = yield* askUserDirectoryReadAccessToken(userDirectory, false);

  if (!token?.userId) {
    return yield* askThrowError(ErrorTypeEnum.Unauthorized, 'User not authenticated');
  }

  return token.userId;
}
