import { askMapParallelBatch, AskResponse } from '@qpqjs/core';

import { EVENT_DOC_AI_CHAT_ROW_CONTENT_READ_BATCH_SIZE } from '../constants/eventDocAiChatRowContentReadBatchSize';
import { EVENT_DOC_AI_CHAT_ROW_CONTENT_UNAVAILABLE_NOTICE } from '../constants/eventDocAiChatRowContentUnavailableNotice';
import { askEventDocAiChatRowContentRead } from '../data/askEventDocAiChatRowContentRead';
import type { EventDocAiChatRow } from '../models';
import { isEventDocAiChatRowStored } from '../module/logic/isEventDocAiChatRowStored';
import { withEventDocAiChatRowContent } from '../module/logic/withEventDocAiChatRowContent';

/**
 * The rows with every content that is held in storage read from the chat blobs drive and put back on its row, a
 * batch at a time. Only those rows cost a read; the rest already hold their content. A content whose file cannot
 * be read becomes a short notice, so one lost file never fails a turn.
 */
export function* askEventDocAiChatRowsResolve(docId: string, chatId: string, rows: EventDocAiChatRow[]): AskResponse<EventDocAiChatRow[]> {
  const storedRows = rows.filter(isEventDocAiChatRowStored);

  if (storedRows.length === 0) {
    return rows;
  }

  const resolvedRows = yield* askMapParallelBatch(storedRows, EVENT_DOC_AI_CHAT_ROW_CONTENT_READ_BATCH_SIZE, function* askResolveRow(row) {
    const read = yield* askEventDocAiChatRowContentRead(docId, chatId, row.sk);

    return withEventDocAiChatRowContent(row, read ? read.content : EVENT_DOC_AI_CHAT_ROW_CONTENT_UNAVAILABLE_NOTICE);
  });

  const resolvedBySk = new Map(resolvedRows.map((row) => [row.sk, row]));

  return rows.map((row) => resolvedBySk.get(row.sk) ?? row);
}
