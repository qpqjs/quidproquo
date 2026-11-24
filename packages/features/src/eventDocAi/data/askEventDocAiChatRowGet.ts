import { askConfigGetGlobal, askKeyValueStoreQuery, AskResponse, kvsAnd, kvsEqual, Nullable } from '@qpqjs/core';

import { askEventDocResolveScope } from '../../eventDoc';
import { EVENT_DOC_AI_CHAT_ROWS_STORE_GLOBAL } from '../constants/eventDocAiGlobalNames';
import type { EventDocAiChatRow } from '../models';
import type { EventDocAiStoredChatRow } from '../types/EventDocAiStoredChatRow';
import { eventDocAiChatRowsPk } from './eventDocAiChatRowsPk';
import { toEventDocAiChatRow } from './toEventDocAiChatRow';

/** One row of a chat by its id, or null when that chat of that document has no such row. */
export function* askEventDocAiChatRowGet(docId: string, chatId: string, sk: string): AskResponse<Nullable<EventDocAiChatRow>> {
  const store = yield* askConfigGetGlobal<string>(EVENT_DOC_AI_CHAT_ROWS_STORE_GLOBAL);
  const scope = yield* askEventDocResolveScope();

  const page = yield* askKeyValueStoreQuery<EventDocAiStoredChatRow>(
    store,
    kvsAnd([kvsEqual('pk', eventDocAiChatRowsPk(docId, chatId)), kvsEqual('sk', sk)]),
    { scope },
  );

  const [row] = page.items;

  return row ? toEventDocAiChatRow(row) : null;
}
