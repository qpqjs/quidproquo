import { askRedactString, AskResponse, askThrowError, ErrorTypeEnum } from '@qpqjs/core';

import { askEventDocAiChatRowContentUrl } from '../data/askEventDocAiChatRowContentUrl';
import { askEventDocAiChatRowGet } from '../data/askEventDocAiChatRowGet';
import type { EventDocAiChatRowContentResult } from '../models';
import { isEventDocAiChatRowStored } from '../module/logic/isEventDocAiChatRowStored';

/**
 * A short-lived link to one chat row's stored content. The link is only made for a row that exists in this chat
 * of this document and really holds its content in storage, so the row id a caller sends can never reach a file
 * of another chat. The caller has already authorised the read; the link is kept out of the log.
 */
export function* askEventDocAiChatRowContentLink(docId: string, chatId: string, sk: string): AskResponse<EventDocAiChatRowContentResult> {
  const row = yield* askEventDocAiChatRowGet(docId, chatId, sk);

  if (row === null || !isEventDocAiChatRowStored(row)) {
    return yield* askThrowError(ErrorTypeEnum.NotFound, 'No such stored chat row content');
  }

  const url = yield* askEventDocAiChatRowContentUrl(docId, chatId, sk);

  yield* askRedactString(url);

  return { url };
}
