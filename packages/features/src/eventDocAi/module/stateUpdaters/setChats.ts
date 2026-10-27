import type { SetChatsPayload } from '../effects/EventDocAiSetChatsEffect';
import type { EventDocAiState } from '../EventDocAiState';

export const setChats = (state: EventDocAiState, { chats }: SetChatsPayload): EventDocAiState => ({
  ...state,
  chats,
});
