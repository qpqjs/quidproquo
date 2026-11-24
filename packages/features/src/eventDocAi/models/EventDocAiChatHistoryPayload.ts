// One page of a chat's rows. Without `before` it is the newest page; with it, the page just before that row.
export type EventDocAiChatHistoryPayload = {
  chatId: string;
  before?: string;
};
