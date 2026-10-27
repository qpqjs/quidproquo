/** The principal a `connectionAuthenticator` stores on the connection: who it is and the storage scope its subscriptions file under. */
export type WebSocketQueueAuthenticateResult = {
  userId: string;
  scope?: string;
};
