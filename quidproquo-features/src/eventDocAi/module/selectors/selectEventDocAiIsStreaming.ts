import type { EventDocAiState } from '../EventDocAiState';

export const selectEventDocAiIsStreaming = (state: EventDocAiState): boolean => state.isStreaming;
