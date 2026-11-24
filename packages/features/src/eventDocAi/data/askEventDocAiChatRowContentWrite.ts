import { askConfigGetGlobal, askFileWriteObjectJson, AskResponse } from '@qpqjs/core';

import { askEventDocResolveScope } from '../../eventDoc';
import { EVENT_DOC_AI_CHAT_BLOBS_DRIVE_GLOBAL } from '../constants/eventDocAiGlobalNames';
import type { EventDocAiChatRowContentFile } from '../types/EventDocAiChatRowContentFile';
import { eventDocAiChatRowContentPath } from './eventDocAiChatRowContentPath';

/** Saves one chat row's content as a file on the chat blobs drive. */
export function* askEventDocAiChatRowContentWrite(docId: string, chatId: string, sk: string, content: unknown): AskResponse<void> {
  const drive = yield* askConfigGetGlobal<string>(EVENT_DOC_AI_CHAT_BLOBS_DRIVE_GLOBAL);
  const scope = yield* askEventDocResolveScope();

  yield* askFileWriteObjectJson<EventDocAiChatRowContentFile>(drive, eventDocAiChatRowContentPath(docId, chatId, sk), { content }, undefined, scope);
}
