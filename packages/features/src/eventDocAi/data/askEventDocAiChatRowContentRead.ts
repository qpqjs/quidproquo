import { askCatch, askConfigGetGlobal, askFileReadObjectJson, AskResponse, Nullable } from '@qpqjs/core';

import { askEventDocResolveScope } from '../../eventDoc';
import { EVENT_DOC_AI_CHAT_BLOBS_DRIVE_GLOBAL } from '../constants/eventDocAiGlobalNames';
import type { EventDocAiChatRowContentFile } from '../types/EventDocAiChatRowContentFile';
import { eventDocAiChatRowContentPath } from './eventDocAiChatRowContentPath';

/** One chat row's content, read from the chat blobs drive. Null means the file could not be read. */
export function* askEventDocAiChatRowContentRead(docId: string, chatId: string, sk: string): AskResponse<Nullable<EventDocAiChatRowContentFile>> {
  const drive = yield* askConfigGetGlobal<string>(EVENT_DOC_AI_CHAT_BLOBS_DRIVE_GLOBAL);
  const scope = yield* askEventDocResolveScope();

  const read = yield* askCatch(askFileReadObjectJson<EventDocAiChatRowContentFile>(drive, eventDocAiChatRowContentPath(docId, chatId, sk), scope));

  return read.success ? read.result : null;
}
