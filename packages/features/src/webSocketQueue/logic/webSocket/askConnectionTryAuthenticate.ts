import { askConfigGetGlobal, askInlineFunctionExecute, AskResponse, askUserDirectorySetAccessToken, Nullable } from '@qpqjs/core';

import {
  getWebSocketQueueGlobalConfigKeyForConnectionAuthenticator,
  getWebSocketQueueGlobalConfigKeyForUserDirectoryName,
} from '../../config/defineWebSocketQueue';
import { askWebsocketApiNameReadOrThrow } from '../../context';
import { webSocketConnectionData } from '../../data';
import { Connection, WebSocketQueueAuthenticateInput, WebSocketQueueAuthenticateResult } from '../../types';

/**
 * Re-checks the connection's stored token for this message and hands the connection record back so the caller can
 * apply its stored storage scope. A user-directory queue also stamps the token onto the session, so spawned events
 * and service functions see the user. A connectionAuthenticator queue re-runs the authenticator; its throw propagates,
 * as an expired user-directory token does. Null when the queue authenticates nobody.
 */
export function* askConnectionTryAuthenticate(connectionId: string): AskResponse<Nullable<Connection>> {
  const apiName = yield* askWebsocketApiNameReadOrThrow();
  const connectionAuthenticator = yield* askConfigGetGlobal<string>(getWebSocketQueueGlobalConfigKeyForConnectionAuthenticator(apiName));
  const userDirectoryName = yield* askConfigGetGlobal<string>(getWebSocketQueueGlobalConfigKeyForUserDirectoryName(apiName));

  if (!connectionAuthenticator && !userDirectoryName) {
    return null;
  }

  const connection = yield* webSocketConnectionData.askConnectionGetById(connectionId);

  if (connection?.accessToken) {
    if (connectionAuthenticator) {
      yield* askInlineFunctionExecute<WebSocketQueueAuthenticateResult, WebSocketQueueAuthenticateInput>(connectionAuthenticator, {
        accessToken: connection.accessToken,
        requestedScope: connection.scope ?? null,
      });
    } else {
      yield* askUserDirectorySetAccessToken(userDirectoryName, connection.accessToken);
    }
  }

  return connection ?? null;
}
