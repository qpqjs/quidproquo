import type { SetActiveChatPayload } from '../effects/EventDocAiSetActiveChatEffect';
import type { EventDocAiState } from '../EventDocAiState';

export const setActiveChat = (state: EventDocAiState, { chatId }: SetActiveChatPayload): EventDocAiState => ({
  ...state,
  activeChatId: chatId,
});
