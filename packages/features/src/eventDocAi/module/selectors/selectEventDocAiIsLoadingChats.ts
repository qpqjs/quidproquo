import type { EventDocAiState } from '../EventDocAiState';

export const selectEventDocAiIsLoadingChats = (state: EventDocAiState): boolean => state.isLoadingChats;
