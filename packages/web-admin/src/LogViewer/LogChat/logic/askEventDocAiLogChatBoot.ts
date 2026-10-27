import { AskResponse, askStateRead } from 'quidproquo-core';
import { askEventDocAiLoadChats, askEventDocAiSelectChat, EventDocAiState } from 'quidproquo-features';

// Resume the most recently active chat for this log, if one exists — no
// chat-list picker UI; the first message on a fresh log implicitly starts one
// (see askEventDocAiSendMessage).
export function* askEventDocAiLogChatBoot(): AskResponse<void> {
  yield* askEventDocAiLoadChats();

  const { chats } = yield* askStateRead<EventDocAiState>();
  const latestChat = [...chats].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

  if (latestChat) {
    yield* askEventDocAiSelectChat(latestChat.chatId);
  }
}
