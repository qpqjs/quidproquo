import type { SetMessagesPayload } from '../effects/EventDocAiSetMessagesEffect';
import { toEventDocAiLocalChatRows } from '../logic/toEventDocAiLocalChatRows';
import { withEventDocAiChatRows } from '../logic/withEventDocAiChatRows';
import type { EventDocAiState } from '../types/EventDocAiState';

/** Replaces the chat's messages (emptied for a new or newly opened chat), so they are no longer stale. */
export const setMessages = (state: EventDocAiState, { messages }: SetMessagesPayload): EventDocAiState => {
  const chatRows = messages.reduce<EventDocAiState['chatRows']>((rows, message) => [...rows, ...toEventDocAiLocalChatRows(message, rows.length)], []);

  return { ...withEventDocAiChatRows(state, chatRows), isHistoryStale: false };
};
