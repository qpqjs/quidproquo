import type { SetChatRowContentPayload } from '../effects/EventDocAiSetChatRowContentEffect';
import { withEventDocAiChatRowContent } from '../logic/withEventDocAiChatRowContent';
import { withEventDocAiChatRows } from '../logic/withEventDocAiChatRows';
import type { EventDocAiState } from '../types/EventDocAiState';

/** Puts downloaded content on its row of the open chat. Content for another chat is dropped. */
export const setChatRowContent = (state: EventDocAiState, { chatId, sk, content }: SetChatRowContentPayload): EventDocAiState =>
  state.activeChatId === chatId
    ? withEventDocAiChatRows(
        state,
        // A row the browser made itself has no id, so an empty id never matches one.
        state.chatRows.map((row) => (sk !== '' && row.sk === sk ? withEventDocAiChatRowContent(row, content) : row)),
      )
    : state;
