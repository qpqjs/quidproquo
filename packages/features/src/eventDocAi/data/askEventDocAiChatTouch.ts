import { askConfigGetGlobal, askDateNow, askKeyValueStoreQuery, AskResponse, kvsAnd, kvsEqual } from 'quidproquo-core';

import { askEventDocResolveScope } from '../../eventDoc';
import { EVENT_DOC_AI_CHAT_LIST_STORE_GLOBAL } from '../constants/eventDocAiGlobalNames';
import type { EventDocAiChatSummary } from '../models';
import { askEventDocAiChatUpsert } from './askEventDocAiChatUpsert';

// Bump a chat's updatedAt so it sorts to the top of the list. Missing record
// (e.g. deleted mid-conversation) is a no-op, not an error.
export function* askEventDocAiChatTouch(docId: string, chatId: string): AskResponse<void> {
  const store = yield* askConfigGetGlobal<string>(EVENT_DOC_AI_CHAT_LIST_STORE_GLOBAL);
  const scope = yield* askEventDocResolveScope();

  const page = yield* askKeyValueStoreQuery<EventDocAiChatSummary>(store, kvsAnd([kvsEqual('docId', docId), kvsEqual('chatId', chatId)]), { scope });

  const chat = page.items[0];
  if (!chat) {
    return;
  }

  const updatedAt = yield* askDateNow();

  yield* askEventDocAiChatUpsert({ ...chat, updatedAt });
}
