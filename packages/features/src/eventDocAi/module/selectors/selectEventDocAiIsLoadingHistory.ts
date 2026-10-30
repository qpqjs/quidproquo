import type { EventDocAiState } from '../types/EventDocAiState';

export const selectEventDocAiIsLoadingHistory = (state: EventDocAiState): boolean => state.isLoadingHistory;
