import type { EventDocAiState } from '../types/EventDocAiState';

export const clearStream = (state: EventDocAiState): EventDocAiState => ({
  ...state,
  streamSegments: [],
  isStreaming: false,
});
