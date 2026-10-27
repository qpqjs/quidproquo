import type { EventDocAiState } from '../EventDocAiState';

export const selectEventDocAiIsLoadingHistory = (state: EventDocAiState): boolean => state.isLoadingHistory;
