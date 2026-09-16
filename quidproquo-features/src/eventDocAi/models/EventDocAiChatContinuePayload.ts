// Everything a fresh execution needs to resume a turn; the rest (connection,
// correlation, scope, actor) travels in the session.
export type EventDocAiChatContinuePayload = {
  docId: string;
  chatId: string;
};
