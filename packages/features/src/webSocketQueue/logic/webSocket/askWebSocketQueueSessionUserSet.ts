import { AskResponse, askUserDirectorySetDecodedAccessToken } from '@qpqjs/core';

import { WebSocketQueueAuthenticateResult } from '../../types';

/**
 * Makes a `connectionAuthenticator`'s principal the session's user when it asked to be one, so the event bus message
 * that follows carries it to every handler. A principal with no `sessionUser` leaves the session as it is.
 */
export function* askWebSocketQueueSessionUserSet(principal: WebSocketQueueAuthenticateResult): AskResponse<void> {
  if (!principal.sessionUser) {
    return;
  }

  yield* askUserDirectorySetDecodedAccessToken({
    userId: principal.userId,
    username: principal.sessionUser.username,
    exp: principal.sessionUser.exp,
    roles: principal.sessionUser.roles,
    // The owning service verified the token itself; no user directory is behind this identity.
    userDirectory: '',
    wasValid: true,
  });
}
