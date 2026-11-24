import { askDateNow, AskResponse } from '@qpqjs/core';

import { askEventDocAiChatGet } from './askEventDocAiChatGet';
import { askEventDocAiChatUpsert } from './askEventDocAiChatUpsert';

// Bump a chat's updatedAt so it sorts to the top of the list. Missing record
// (e.g. deleted mid-conversation) is a no-op, not an error.
export function* askEventDocAiChatTouch(docId: string, chatId: string): AskResponse<void> {
  const chat = yield* askEventDocAiChatGet(docId, chatId);
  if (!chat) {
    return;
  }

  const updatedAt = yield* askDateNow();

  yield* askEventDocAiChatUpsert({ ...chat, updatedAt });
}
