import type { SetChatRowsPayload } from '../effects/EventDocAiSetChatRowsEffect';
import { withEventDocAiChatRows } from '../logic/withEventDocAiChatRows';
import type { EventDocAiState } from '../types/EventDocAiState';

/** Replaces the open chat's rows with a fresh full load, so they are no longer stale. Rows for another chat are dropped. */
export const setChatRows = (state: EventDocAiState, { chatId, rows }: SetChatRowsPayload): EventDocAiState =>
  state.activeChatId === chatId ? { ...withEventDocAiChatRows(state, rows), isHistoryStale: false } : state;
