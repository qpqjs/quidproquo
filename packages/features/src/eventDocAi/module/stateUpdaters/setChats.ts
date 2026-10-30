import type { SetChatsPayload } from '../effects/EventDocAiSetChatsEffect';
import type { EventDocAiState } from '../types/EventDocAiState';

export const setChats = (state: EventDocAiState, { chats }: SetChatsPayload): EventDocAiState => ({
  ...state,
  chats,
});
