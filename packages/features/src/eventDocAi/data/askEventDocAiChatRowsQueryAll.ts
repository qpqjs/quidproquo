import { askConfigGetGlobal, askKeyValueStoreQueryAll, AskResponse, kvsEqual } from '@qpqjs/core';

import { askEventDocResolveScope } from '../../eventDoc';
import { EVENT_DOC_AI_CHAT_ROWS_STORE_GLOBAL } from '../constants/eventDocAiGlobalNames';
import type { EventDocAiChatRow } from '../models';
import type { EventDocAiStoredChatRow } from '../types/EventDocAiStoredChatRow';
import { eventDocAiChatRowsPk } from './eventDocAiChatRowsPk';
import { toEventDocAiChatRow } from './toEventDocAiChatRow';

/** Every row of a chat, oldest first. Reads the row its own writer just added, since a turn loads straight after saving. */
export function* askEventDocAiChatRowsQueryAll(docId: string, chatId: string): AskResponse<EventDocAiChatRow[]> {
  const store = yield* askConfigGetGlobal<string>(EVENT_DOC_AI_CHAT_ROWS_STORE_GLOBAL);
  const scope = yield* askEventDocResolveScope();

  const rows = yield* askKeyValueStoreQueryAll<EventDocAiStoredChatRow>(store, kvsEqual('pk', eventDocAiChatRowsPk(docId, chatId)), {
    scope,
    sortAscending: true,
    consistentRead: true,
  });

  return rows.map(toEventDocAiChatRow);
}
