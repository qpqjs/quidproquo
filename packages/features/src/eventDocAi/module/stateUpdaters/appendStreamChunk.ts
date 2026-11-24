import type { AppendStreamChunkPayload } from '../effects/EventDocAiAppendStreamChunkEffect';
import { foldStreamPart } from '../logic/foldStreamPart';
import type { EventDocAiState } from '../types/EventDocAiState';

// Folded on arrival so each chunk is a small update to the last segment rather
// than a growing raw-part list re-merged on every render. A part of a reply for a chat
// that is not open is dropped, so it never shows in the chat the person switched to.
export const appendStreamChunk = (state: EventDocAiState, { part, chatId }: AppendStreamChunkPayload): EventDocAiState =>
  chatId !== undefined && chatId !== state.activeChatId
    ? state
    : {
        ...state,
        streamSegments: foldStreamPart(state.streamSegments, part),
        isStreaming: true,
      };
