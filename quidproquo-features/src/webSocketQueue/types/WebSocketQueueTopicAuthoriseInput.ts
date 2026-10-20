/** What a queue's `topicAuthoriser` inline function receives; it throws to refuse the subscription. */
export type WebSocketQueueTopicAuthoriseInput = {
  connectionId: string;
  userId?: string;
  scope?: string;
  // The token the connection authenticated with, for an authoriser that owns the token's meaning (a connectionAuthenticator queue).
  accessToken?: string;
  // The unscoped topic the client asked for.
  topic: string;
};
