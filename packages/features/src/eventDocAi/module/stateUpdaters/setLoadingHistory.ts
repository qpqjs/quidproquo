import type { SetLoadingHistoryPayload } from '../effects/EventDocAiSetLoadingHistoryEffect';
import type { EventDocAiState } from '../EventDocAiState';

export const setLoadingHistory = (state: EventDocAiState, { isLoading }: SetLoadingHistoryPayload): EventDocAiState => ({
  ...state,
  isLoadingHistory: isLoading,
});
