import { askConfigGetGlobal, AskResponse, askThrowError, askUserDirectoryReadAccessToken, ErrorTypeEnum } from 'quidproquo-core';

import { EVENT_DOC_USER_DIRECTORY_GLOBAL } from '../constants/eventDocGlobalNames';
import type { EventDocEventActor } from '../models';

/** Resolves the event actor from the request's access token; throws Unauthorized when there is none. */
export function* askEventDocResolveActor(): AskResponse<EventDocEventActor> {
  const userDirectory = yield* askConfigGetGlobal<string>(EVENT_DOC_USER_DIRECTORY_GLOBAL);

  const token = yield* askUserDirectoryReadAccessToken(userDirectory, false);

  if (!token?.userId) {
    return yield* askThrowError(ErrorTypeEnum.Unauthorized, 'User not authenticated');
  }

  return {
    userId: token.userId,
    userDisplayName: token.username,
  };
}
