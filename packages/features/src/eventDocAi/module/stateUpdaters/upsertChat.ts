import type { UpsertChatPayload } from '../effects/EventDocAiUpsertChatEffect';
import type { EventDocAiState } from '../types/EventDocAiState';

export const upsertChat = (state: EventDocAiState, { chat }: UpsertChatPayload): EventDocAiState => ({
  ...state,
  chats: [chat, ...state.chats.filter((existing) => existing.chatId !== chat.chatId)],
});
