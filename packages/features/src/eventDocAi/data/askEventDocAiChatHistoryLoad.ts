import { askConfigGetGlobal, askFileExists, askFileReadObjectJson, AskResponse } from 'quidproquo-core';

import { askEventDocResolveScope } from '../../eventDoc';
import { EVENT_DOC_AI_CHAT_DRIVE_GLOBAL } from '../constants/eventDocAiGlobalNames';
import type { EventDocAiChatMessage } from '../models';
import { EventDocAiChatHistoryFile } from '../types/EventDocAiChatHistoryFile';
import { eventDocAiChatHistoryPath } from './eventDocAiChatHistoryPath';

export function* askEventDocAiChatHistoryLoad(docId: string, chatId: string): AskResponse<EventDocAiChatMessage[]> {
  const drive = yield* askConfigGetGlobal<string>(EVENT_DOC_AI_CHAT_DRIVE_GLOBAL);
  const scope = yield* askEventDocResolveScope();
  const path = eventDocAiChatHistoryPath(docId, chatId);

  const exists = yield* askFileExists(drive, path, scope);
  if (!exists) {
    return [];
  }

  const file = yield* askFileReadObjectJson<EventDocAiChatHistoryFile>(drive, path, scope);

  return file.messages;
}
