import { askConfigGetGlobal, AskResponse } from '@qpqjs/core';

import {
  getWebSocketQueueGlobalConfigKeyForConnectionAuthenticator,
  getWebSocketQueueGlobalConfigKeyForUserDirectoryName,
} from '../../config/defineWebSocketQueue';
import { askWebsocketApiNameReadOrThrow } from '../../context';

/**
 * Whether this queue authenticates connections at all: a user directory or a connection authenticator is
 * configured. On such a queue a connection that has not authenticated may only ping and authenticate.
 */
export function* askWebSocketQueueAuthenticatesConnections(): AskResponse<boolean> {
  const apiName = yield* askWebsocketApiNameReadOrThrow();
  const connectionAuthenticator = yield* askConfigGetGlobal<string>(getWebSocketQueueGlobalConfigKeyForConnectionAuthenticator(apiName));
  const userDirectoryName = yield* askConfigGetGlobal<string>(getWebSocketQueueGlobalConfigKeyForUserDirectoryName(apiName));

  return !!connectionAuthenticator || !!userDirectoryName;
}
