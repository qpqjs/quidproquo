import type { EventDocAiState } from '../types/EventDocAiState';

export const selectEventDocAiIsSending = (state: EventDocAiState): boolean => state.isSending;
