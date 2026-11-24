import { askConfigGetGlobal, askKeyValueStoreQuery, AskResponse, kvsAnd, kvsEqual, Nullable } from '@qpqjs/core';

import { askEventDocResolveScope } from '../../eventDoc';
import { EVENT_DOC_AI_CHAT_LIST_STORE_GLOBAL } from '../constants/eventDocAiGlobalNames';
import type { EventDocAiChatSummary } from '../models';

/** One chat of a document from the chat list, or null when that document has no such chat. */
export function* askEventDocAiChatGet(docId: string, chatId: string): AskResponse<Nullable<EventDocAiChatSummary>> {
  const store = yield* askConfigGetGlobal<string>(EVENT_DOC_AI_CHAT_LIST_STORE_GLOBAL);
  const scope = yield* askEventDocResolveScope();

  const page = yield* askKeyValueStoreQuery<EventDocAiChatSummary>(store, kvsAnd([kvsEqual('docId', docId), kvsEqual('chatId', chatId)]), { scope });

  return page.items[0] ?? null;
}
