import { AskResponse, askStateRead } from '@qpqjs/core';

import type { EventDocAiChatRow } from '../models';
import { EventDocAiLoadChatRowsMode } from '../models/EventDocAiLoadChatRowsMode';
import { askEventDocAiPrependChatRows } from '../module/actionCreators/askEventDocAiPrependChatRows';
import { askEventDocAiSetChatRows } from '../module/actionCreators/askEventDocAiSetChatRows';
import type { EventDocAiState } from '../module/types/EventDocAiState';
import { askEventDocAiChatHistoryRequest } from '../transport/askEventDocAiChatHistoryRequest';

/**
 * Loads a whole chat from the server a page at a time, newest page first, and returns its rows oldest first. A
 * chat is never sent whole: it grows without limit and a websocket message does not. Returns null when the
 * person opened another chat before the load finished; the rows loaded so far are then dropped by the state.
 */
export function* askEventDocAiLoadChatRows(chatId: string, mode: EventDocAiLoadChatRowsMode): AskResponse<EventDocAiChatRow[] | null> {
  let rows: EventDocAiChatRow[] = [];
  let before: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const page = yield* askEventDocAiChatHistoryRequest(before === undefined ? { chatId } : { chatId, before });

    const { activeChatId } = yield* askStateRead<EventDocAiState>();
    if (activeChatId !== chatId) {
      return null;
    }

    if (mode === EventDocAiLoadChatRowsMode.ShowEachPage) {
      yield* askEventDocAiPrependChatRows(chatId, page.rows);
    }

    rows = [...page.rows, ...rows];
    before = page.rows[0]?.sk;
    // A page with no rows cannot say where the next one starts, so it ends the load whatever it claims.
    hasMore = page.hasMore && before !== undefined;
  }

  if (mode === EventDocAiLoadChatRowsMode.ReplaceWhenLoaded) {
    yield* askEventDocAiSetChatRows(chatId, rows);
  }

  return rows;
}
