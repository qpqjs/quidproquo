import type { SetActiveChatPayload } from '../effects/EventDocAiSetActiveChatEffect';
import type { EventDocAiState } from '../types/EventDocAiState';

export const setActiveChat = (state: EventDocAiState, { chatId }: SetActiveChatPayload): EventDocAiState => ({
  ...state,
  activeChatId: chatId,
});
