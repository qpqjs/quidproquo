import type { EventDocAiChatMessage } from '../../models';
import type { FinalizeStreamPayload } from '../effects/EventDocAiFinalizeStreamEffect';
import { toEventDocAiLocalChatRows } from '../logic/toEventDocAiLocalChatRows';
import { withEventDocAiChatRows } from '../logic/withEventDocAiChatRows';
import type { EventDocAiState } from '../types/EventDocAiState';

/**
 * Moves the streamed reply into the finalized messages and clears the stream. The history is marked
 * stale when the server held part of the reply back, so the chat is reloaded once the send ends. A
 * reply for a chat that is not open is dropped: its parts never streamed here, and that chat is
 * loaded from the server when it is opened.
 */
export const finalizeStream = (
  state: EventDocAiState,
  { chatId, model, usage, trailingSegments, isPartial }: FinalizeStreamPayload,
): EventDocAiState => {
  if (state.activeChatId !== chatId) {
    return state;
  }

  const segments = [...state.streamSegments, ...trailingSegments];
  const message: EventDocAiChatMessage = { role: 'assistant', segments, model, ...(usage ? { usage } : {}) };

  return {
    ...withEventDocAiChatRows(state, [...state.chatRows, ...toEventDocAiLocalChatRows(message, state.chatRows.length)]),
    streamSegments: [],
    isStreaming: false,
    isHistoryStale: state.isHistoryStale || isPartial,
  };
};
