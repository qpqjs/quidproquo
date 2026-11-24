import { AskResponse } from '@qpqjs/core';

import { EVENT_DOC_AI_CHAT_PAGE_MAX_BYTES } from '../constants/eventDocAiChatPageMaxBytes';
import { askEventDocAiChatRowsQueryPage } from '../data/askEventDocAiChatRowsQueryPage';
import type { EventDocAiChatHistoryResult, EventDocAiChatRow } from '../models';
import { eventDocAiChatRowsBytes } from '../module/logic/eventDocAiChatRowsBytes';
import { askEventDocAiUsageVisible } from './askEventDocAiUsageVisible';

// The newest-first rows that fit the byte budget, never fewer than one so a page always moves the reader on.
const takeWithinBudget = (newestFirst: EventDocAiChatRow[]): EventDocAiChatRow[] => {
  const taken: EventDocAiChatRow[] = [];

  for (const row of newestFirst) {
    if (taken.length > 0 && eventDocAiChatRowsBytes([...taken, row]) > EVENT_DOC_AI_CHAT_PAGE_MAX_BYTES) {
      break;
    }

    taken.push(row);
  }

  return taken;
};

/**
 * One page of a chat's rows for the browser, oldest first: the newest rows before `before` that fit in one
 * websocket message. Usage rows are left out unless the chat lets usage reach the browser. Content held in
 * storage is not loaded; the browser asks for each one it needs.
 */
export function* askEventDocAiChatHistoryPage(docId: string, chatId: string, before?: string): AskResponse<EventDocAiChatHistoryResult> {
  const includeUsage = yield* askEventDocAiUsageVisible();
  const page = yield* askEventDocAiChatRowsQueryPage(docId, chatId, { before, includeUsage });
  const taken = takeWithinBudget(page.items);

  return {
    rows: [...taken].reverse(),
    hasMore: taken.length < page.items.length || page.nextPageKey !== undefined,
  };
}
