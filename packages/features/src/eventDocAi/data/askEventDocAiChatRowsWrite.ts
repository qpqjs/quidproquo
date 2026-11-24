import { askConfigGetGlobal, askKeyValueStoreUpsertMany, AskResponse } from '@qpqjs/core';

import { askEventDocResolveScope } from '../../eventDoc';
import { EVENT_DOC_AI_CHAT_ROWS_STORE_GLOBAL } from '../constants/eventDocAiGlobalNames';
import type { EventDocAiChatRow } from '../models';
import type { EventDocAiStoredChatRow } from '../types/EventDocAiStoredChatRow';
import { eventDocAiChatRowsPk } from './eventDocAiChatRowsPk';

/** Adds rows to a chat. Rows are only ever added: a chat's history is not rewritten. */
export function* askEventDocAiChatRowsWrite(docId: string, chatId: string, rows: EventDocAiChatRow[]): AskResponse<void> {
  if (rows.length === 0) {
    return;
  }

  const store = yield* askConfigGetGlobal<string>(EVENT_DOC_AI_CHAT_ROWS_STORE_GLOBAL);
  const scope = yield* askEventDocResolveScope();
  const pk = eventDocAiChatRowsPk(docId, chatId);

  yield* askKeyValueStoreUpsertMany<EventDocAiStoredChatRow>(
    store,
    rows.map((row) => ({ ...row, pk })),
    { scope },
  );
}
