import { askGuidNewSortableMany, askMap, AskResponse } from '@qpqjs/core';

import { askEventDocAiChatRowsWrite } from '../data/askEventDocAiChatRowsWrite';
import type { EventDocAiChatMessage, EventDocAiChatRow } from '../models';
import { eventDocAiMessageToChatRowDrafts } from '../module/logic/eventDocAiMessageToChatRowDrafts';
import { askEventDocAiChatRowPlace } from './askEventDocAiChatRowPlace';

/**
 * Adds messages to the end of a chat as rows. The row ids are minted together so the rows keep the order their
 * pieces were produced in, and a message's id is the id of its first row. Big content is saved before the rows.
 */
export function* askEventDocAiChatMessagesAppend(docId: string, chatId: string, messages: EventDocAiChatMessage[]): AskResponse<void> {
  const draftsByMessage = messages.map(eventDocAiMessageToChatRowDrafts);
  const sks = yield* askGuidNewSortableMany(draftsByMessage.reduce((count, drafts) => count + drafts.length, 0));

  const rows: EventDocAiChatRow[] = [];
  for (const drafts of draftsByMessage) {
    const messageSks = sks.slice(rows.length, rows.length + drafts.length);
    const [messageId] = messageSks;

    drafts.forEach((draft, index) => rows.push({ ...draft, sk: messageSks[index] ?? '', messageId: messageId ?? '' } as EventDocAiChatRow));
  }

  // Content too big for a row is saved to the blobs drive first; the rows are written once it all is.
  const placedRows = yield* askMap(rows, function* askPlaceRow(row) {
    return yield* askEventDocAiChatRowPlace(docId, chatId, row);
  });

  yield* askEventDocAiChatRowsWrite(docId, chatId, placedRows);
}
