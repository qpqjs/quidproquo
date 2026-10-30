import type { EventDocAiState } from '../types/EventDocAiState';

export const selectEventDocAiIsStreaming = (state: EventDocAiState): boolean => state.isStreaming;
