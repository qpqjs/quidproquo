import type { EventDocAiState } from '../EventDocAiState';

export const selectEventDocAiIsSending = (state: EventDocAiState): boolean => state.isSending;
