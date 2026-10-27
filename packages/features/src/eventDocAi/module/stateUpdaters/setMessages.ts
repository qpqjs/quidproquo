import type { SetMessagesPayload } from '../effects/EventDocAiSetMessagesEffect';
import type { EventDocAiState } from '../EventDocAiState';

export const setMessages = (state: EventDocAiState, { messages }: SetMessagesPayload): EventDocAiState => ({
  ...state,
  chatMessages: messages,
});
