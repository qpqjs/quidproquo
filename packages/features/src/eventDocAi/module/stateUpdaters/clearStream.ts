import type { ClearStreamPayload } from '../effects/EventDocAiClearStreamEffect';
import type { EventDocAiState } from '../types/EventDocAiState';

export const clearStream = (state: EventDocAiState, { chatId }: ClearStreamPayload): EventDocAiState =>
  chatId !== undefined && chatId !== state.activeChatId
    ? state
    : {
        ...state,
        streamSegments: [],
        isStreaming: false,
      };
