import {
  askCatch,
  askConfigGetGlobal,
  askInlineFunctionExecute,
  AskResponse,
  askUserDirectorySetAccessToken,
  DecodedAccessToken,
  Nullable,
} from '@qpqjs/core';

import {
  getWebSocketQueueGlobalConfigKeyForConnectionAuthenticator,
  getWebSocketQueueGlobalConfigKeyForConnectionScopeResolver,
  getWebSocketQueueGlobalConfigKeyForUserDirectoryName,
} from '../../../config/defineWebSocketQueue';
import { askWebsocketReadApiNameOrThrow } from '../../../context';
import { webSocketConnectionData } from '../../../data';
import { webSocketSubscriptionData } from '../../../data/subscriptionData';
import {
  AnyWebSocketQueueEventMessageWithCorrelation,
  Connection,
  WebSocketQueueAuthenticateInput,
  WebSocketQueueAuthenticateResult,
  WebSocketQueueClientEventMessageAuthenticate,
  WebSocketQueueClientMessageEventType,
  WebSocketQueueServerEventMessageAuthenticated,
  WebSocketQueueServerEventMessageUnauthenticated,
  WebSocketQueueServerMessageEventType,
} from '../../../types';
import { askBroadcastUnknownMessage } from '../askBroadcastUnknownMessage';
import { askSendMessage } from '../askSendMessage';
import { askProcessOnUnauthenticate } from './askProcessOnUnauthenticate';

export function isWebSocketAuthenticateMessage(
  event: AnyWebSocketQueueEventMessageWithCorrelation,
): event is WebSocketQueueClientEventMessageAuthenticate {
  return event.type === WebSocketQueueClientMessageEventType.Authenticate;
}

interface ConnectionScopeResolution {
  accepted: boolean;
  scope: string | undefined;
}

// Resolve the connection's storage scope via the configured
// connectionScopeResolver inline function, which runs on EVERY authenticate
// (claim or not) and returns the effective scope to store - e.g. the tenant
// feature resolves a claim to a membership-checked tenant scope and no claim
// to the user's own personal scope, never unscoped. A resolver throw rejects
// the authenticate. A claim with NO resolver configured is invalid by
// definition - an unvalidatable scope must never be silently accepted (wrong
// partition) or silently dropped (data lands in the unscoped partition while
// the client believes it is scoped); no claim on a plain queue stays unscoped.
function* askResolveConnectionScope(apiName: string, userId: string, requestedScope: string | null): AskResponse<ConnectionScopeResolution> {
  const scopeResolver = yield* askConfigGetGlobal<string>(getWebSocketQueueGlobalConfigKeyForConnectionScopeResolver(apiName));

  if (!scopeResolver) {
    return { accepted: !requestedScope, scope: undefined };
  }

  const resolution = yield* askCatch(
    askInlineFunctionExecute<Nullable<string>, { userId: string; requestedScope: string | null }>(scopeResolver, { userId, requestedScope }),
  );

  if (!resolution.success) {
    return { accepted: false, scope: undefined };
  }

  return { accepted: true, scope: resolution.result ?? undefined };
}

// The user directory validates the token and the scope resolver settles the scope; either refusing rejects the whole
// authenticate, so the client never ends up authenticated on a different scope than it asked for.
function* askAuthenticateWithUserDirectory(
  apiName: string,
  userDirectoryName: string,
  accessToken: string,
  requestedScope: Nullable<string>,
): AskResponse<Nullable<WebSocketQueueAuthenticateResult>> {
  const result = yield* askCatch(askUserDirectorySetAccessToken(userDirectoryName, accessToken));

  if (!result.success) {
    return null;
  }

  const decodedAccessToken: DecodedAccessToken = result.result;
  const scopeResolution = yield* askResolveConnectionScope(apiName, decodedAccessToken.userId, requestedScope);

  if (!scopeResolution.accepted) {
    return null;
  }

  return { userId: decodedAccessToken.userId, scope: scopeResolution.scope };
}

// The owning service's authenticator owns both the token and the scope; a throw rejects.
function* askAuthenticateWithAuthenticator(
  connectionAuthenticator: string,
  accessToken: string,
  requestedScope: Nullable<string>,
): AskResponse<Nullable<WebSocketQueueAuthenticateResult>> {
  const result = yield* askCatch(
    askInlineFunctionExecute<WebSocketQueueAuthenticateResult, WebSocketQueueAuthenticateInput>(connectionAuthenticator, {
      accessToken,
      requestedScope,
    }),
  );

  return result.success ? result.result : null;
}

function* askStoreAuthenticated(connection: Connection, accessToken: string, principal: WebSocketQueueAuthenticateResult): AskResponse<void> {
  yield* webSocketConnectionData.askUpsert({
    ...connection,

    userId: principal.userId,
    accessToken,

    // Always re-stamped: on a plain queue no claim stays unscoped; on a queue with a resolver (tenant queues) no claim
    // resolves to the user's own personal scope, never unscoped.
    scope: principal.scope,
  });

  // Subscriptions are filed under the scope the connection held when it subscribed, so a re-authenticate (a tenant
  // switch, say) drops them all; the client subscribes again on Authenticated.
  yield* webSocketSubscriptionData.askDeleteByConnectionId(connection.id);

  yield* askSendMessage(connection.id, {
    type: WebSocketQueueServerMessageEventType.Authenticated,
  } satisfies WebSocketQueueServerEventMessageAuthenticated);

  // Send a websocket message to the event buss WITHOUT an access token
  const webSocketQueueClientEventMessageAuthenticate: WebSocketQueueClientEventMessageAuthenticate = {
    type: WebSocketQueueClientMessageEventType.Authenticate,
    payload: {},
  };

  yield* askBroadcastUnknownMessage(webSocketQueueClientEventMessageAuthenticate);
}

export function* askProcessOnAuthenticate(connectionId: string, accessToken: string, scope?: string): AskResponse<void> {
  const connection = yield* webSocketConnectionData.askGetById(connectionId);

  // No connection record (e.g. the connect event hasn't been processed yet) ,
  // tell the client rather than dropping the request silently, so it can
  // distinguish "not authenticated" from "no reply".
  if (!connection) {
    yield* askSendMessage(connectionId, {
      type: WebSocketQueueServerMessageEventType.Unauthenticated,
    } satisfies WebSocketQueueServerEventMessageUnauthenticated);
    return;
  }

  const apiName = yield* askWebsocketReadApiNameOrThrow();
  const connectionAuthenticator = yield* askConfigGetGlobal<string>(getWebSocketQueueGlobalConfigKeyForConnectionAuthenticator(apiName));
  const userDirectoryName = yield* askConfigGetGlobal<string>(getWebSocketQueueGlobalConfigKeyForUserDirectoryName(apiName));

  // A queue with neither cannot authenticate anyone; the message is ignored.
  if (!connectionAuthenticator && !userDirectoryName) {
    return;
  }

  const principal = connectionAuthenticator
    ? yield* askAuthenticateWithAuthenticator(connectionAuthenticator, accessToken, scope || null)
    : yield* askAuthenticateWithUserDirectory(apiName, userDirectoryName, accessToken, scope || null);

  // A rejected authenticate downgrades the CONNECTION, not just the reply:
  // on a re-authenticate the row still holds the previous userId/accessToken/
  // scope, and later messages re-stamp auth from the row, so leaving it
  // untouched would keep the session alive under the old identity and scope
  // while the client believes it is unauthenticated.
  if (!principal) {
    return yield* askProcessOnUnauthenticate(connectionId);
  }

  yield* askStoreAuthenticated(connection, accessToken, principal);
}
