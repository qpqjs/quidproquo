import { AskResponse } from '@qpqjs/core';

import { serializeEventDocValue } from '../../eventDoc/logic/serializeEventDocValue';
import { EVENT_DOC_AI_CHAT_ROW_INLINE_MAX_BYTES } from '../constants/eventDocAiChatRowInlineMaxBytes';
import { askEventDocAiChatRowContentWrite } from '../data/askEventDocAiChatRowContentWrite';
import type { EventDocAiChatRow } from '../models';
import { getEventDocAiChatRowInlineContent } from '../module/logic/getEventDocAiChatRowInlineContent';
import { withEventDocAiChatRowStored } from '../module/logic/withEventDocAiChatRowStored';

/**
 * Decides where a row's content lives before the row is written. Content that fits stays on the row and nothing
 * is saved. Content too big for a row is saved as one file on the chat blobs drive and the row is returned
 * marked as holding it there. The caller writes the row afterwards, so a row never points at a file that is not
 * there. This writes no row.
 */
export function* askEventDocAiChatRowPlace(docId: string, chatId: string, row: EventDocAiChatRow): AskResponse<EventDocAiChatRow> {
  const inline = getEventDocAiChatRowInlineContent(row);

  if (!inline || serializeEventDocValue(inline.content).bytes <= EVENT_DOC_AI_CHAT_ROW_INLINE_MAX_BYTES) {
    return row;
  }

  yield* askEventDocAiChatRowContentWrite(docId, chatId, row.sk, inline.content);

  return withEventDocAiChatRowStored(row);
}
