import type { AppendChatMessagePayload } from '../effects/EventDocAiAppendChatMessageEffect';
import type { EventDocAiState } from '../EventDocAiState';

export const appendChatMessage = (state: EventDocAiState, { message }: AppendChatMessagePayload): EventDocAiState => ({
  ...state,
  chatMessages: [...state.chatMessages, message],
});
