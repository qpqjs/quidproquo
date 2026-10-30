import type { AppendStreamChunkPayload } from '../effects/EventDocAiAppendStreamChunkEffect';
import { foldStreamPart } from '../logic/foldStreamPart';
import type { EventDocAiState } from '../types/EventDocAiState';

// Folded on arrival so each chunk is a small update to the last segment rather
// than a growing raw-part list re-merged on every render.
export const appendStreamChunk = (state: EventDocAiState, { part }: AppendStreamChunkPayload): EventDocAiState => ({
  ...state,
  streamSegments: foldStreamPart(state.streamSegments, part),
  isStreaming: true,
});
