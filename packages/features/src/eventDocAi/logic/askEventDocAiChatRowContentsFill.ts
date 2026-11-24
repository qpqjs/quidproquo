import { askCatch, askLogCreate, AskResponse, askStateRead, LogLevelEnum } from '@qpqjs/core';

import type { EventDocAiChatRow } from '../models';
import { askEventDocAiSetChatRowContent } from '../module/actionCreators/askEventDocAiSetChatRowContent';
import { isEventDocAiChatRowStored } from '../module/logic/isEventDocAiChatRowStored';
import type { EventDocAiState } from '../module/types/EventDocAiState';
import { askEventDocAiChatRowContentDownload } from '../transport/askEventDocAiChatRowContentDownload';
import { askEventDocAiChatRowContentRequest } from '../transport/askEventDocAiChatRowContentRequest';

// Asks for the link to one row's stored content and downloads it.
function* askEventDocAiChatRowContentFetch(chatId: string, sk: string): AskResponse<unknown> {
  const { url } = yield* askEventDocAiChatRowContentRequest({ chatId, sk });

  return yield* askEventDocAiChatRowContentDownload(url);
}

/**
 * Downloads the content of every one of these rows that holds it in storage and puts it on its row, one at a
 * time, newest first. Rows that hold their own content cost nothing. Until a content arrives its tool shows as
 * still running. One that cannot be fetched is logged and skipped, and the work stops as soon as the person
 * opens another chat.
 */
export function* askEventDocAiChatRowContentsFill(chatId: string, rows: EventDocAiChatRow[]): AskResponse<void> {
  const storedRows = rows.filter(isEventDocAiChatRowStored).reverse();

  for (const { sk } of storedRows) {
    const { activeChatId } = yield* askStateRead<EventDocAiState>();
    if (activeChatId !== chatId) {
      return;
    }

    const fetched = yield* askCatch(askEventDocAiChatRowContentFetch(chatId, sk));

    if (fetched.success) {
      yield* askEventDocAiSetChatRowContent({ chatId, sk, content: fetched.result });
    } else {
      yield* askLogCreate(LogLevelEnum.Warn, 'eventDocAi: a stored chat row content could not be loaded', {
        chatId,
        sk,
        errorText: fetched.error.errorText,
      });
    }
  }
}
