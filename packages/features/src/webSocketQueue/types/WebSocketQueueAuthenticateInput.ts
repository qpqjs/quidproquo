import { Nullable } from 'quidproquo-core';

/** What a queue's `connectionAuthenticator` inline function receives; it throws to reject the token. */
export type WebSocketQueueAuthenticateInput = {
  accessToken: string;
  // The storage scope the client claimed, if any. The authenticator decides what, if anything, a claim means.
  requestedScope: Nullable<string>;
};
