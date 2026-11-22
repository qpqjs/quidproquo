import { WebSocketQueueSessionUser } from './WebSocketQueueSessionUser';

/** The principal a `connectionAuthenticator` stores on the connection: who it is and the storage scope its subscriptions file under. */
export type WebSocketQueueAuthenticateResult = {
  userId: string;
  scope?: string;
  // Given, the handlers of this connection's messages see the principal as the session's user. Omitted, they run with
  // no user and identify the caller themselves (from the storage scope, say).
  sessionUser?: WebSocketQueueSessionUser;
};
