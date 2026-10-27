import type { SetLoadingChatsPayload } from '../effects/EventDocAiSetLoadingChatsEffect';
import type { EventDocAiState } from '../EventDocAiState';

export const setLoadingChats = (state: EventDocAiState, { isLoading }: SetLoadingChatsPayload): EventDocAiState => ({
  ...state,
  isLoadingChats: isLoading,
});
