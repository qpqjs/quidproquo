/**
 * How a `connectionAuthenticator`'s principal appears as the session's user to the handlers of its messages, so code
 * that asks who the user is gets the same answer it would on a user-directory queue.
 */
export type WebSocketQueueSessionUser = {
  // The name shown for the principal, where a user directory would give a username.
  username: string;
  // When the principal's token stops being valid, as a Unix timestamp in seconds. Handlers refuse the user after it.
  exp: number;
  roles?: string[];
};
