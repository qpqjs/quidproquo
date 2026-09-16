import type { EventDocAiState } from '../EventDocAiState';

export const clearStream = (state: EventDocAiState): EventDocAiState => ({
  ...state,
  streamSegments: [],
  isStreaming: false,
});
