import { askConfigGetGlobal, askKeyValueStoreQuery, AskResponse, kvsEqual } from 'quidproquo-core';

import { askEventDocResolveScope } from '../../eventDoc';
import { EVENT_DOC_AI_CHAT_LIST_STORE_GLOBAL } from '../constants/eventDocAiGlobalNames';
import type { EventDocAiChatSummary } from '../models';

// All chats for one document, most recently touched first. Sorted here rather
// than by a GSI because per-doc chat counts are small.
export function* askEventDocAiChatList(docId: string): AskResponse<EventDocAiChatSummary[]> {
  const store = yield* askConfigGetGlobal<string>(EVENT_DOC_AI_CHAT_LIST_STORE_GLOBAL);
  const scope = yield* askEventDocResolveScope();

  const page = yield* askKeyValueStoreQuery<EventDocAiChatSummary>(store, kvsEqual('docId', docId), { scope });

  return [...page.items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
