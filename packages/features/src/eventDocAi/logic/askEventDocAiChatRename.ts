import { AskResponse, askThrowError, ErrorTypeEnum } from '@qpqjs/core';

import { askEventDocAiChatGet } from '../data/askEventDocAiChatGet';
import { askEventDocAiChatUpsert } from '../data/askEventDocAiChatUpsert';
import { normaliseEventDocAiChatName } from './normaliseEventDocAiChatName';

/** Gives a chat a new name. Refuses a name with nothing usable in it, and a chat the document does not have. */
export function* askEventDocAiChatRename(docId: string, chatId: string, name: unknown): AskResponse<void> {
  const cleanName = normaliseEventDocAiChatName(name);
  if (!cleanName) {
    return yield* askThrowError(ErrorTypeEnum.BadRequest, 'A chat name needs at least one character.');
  }

  const chat = yield* askEventDocAiChatGet(docId, chatId);
  if (!chat) {
    return yield* askThrowError(ErrorTypeEnum.NotFound, 'This chat no longer exists.');
  }

  yield* askEventDocAiChatUpsert({ ...chat, name: cleanName });
}
