import type { EventDocAiState } from '../types/EventDocAiState';

export const selectEventDocAiIsLoadingChats = (state: EventDocAiState): boolean => state.isLoadingChats;
