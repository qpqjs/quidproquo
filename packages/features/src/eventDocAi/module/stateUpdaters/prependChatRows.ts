import type { PrependChatRowsPayload } from '../effects/EventDocAiPrependChatRowsEffect';
import { withEventDocAiChatRows } from '../logic/withEventDocAiChatRows';
import type { EventDocAiState } from '../types/EventDocAiState';

/** Adds an older page above the open chat's rows. A page for another chat (one left while it was loading) is dropped. */
export const prependChatRows = (state: EventDocAiState, { chatId, rows }: PrependChatRowsPayload): EventDocAiState =>
  state.activeChatId === chatId ? withEventDocAiChatRows(state, [...rows, ...state.chatRows]) : state;
