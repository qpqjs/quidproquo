import { askConfigGetGlobal, askFileWriteObjectJson, AskResponse } from 'quidproquo-core';

import { askEventDocResolveScope } from '../../eventDoc';
import { EVENT_DOC_AI_CHAT_DRIVE_GLOBAL } from '../constants/eventDocAiGlobalNames';
import type { EventDocAiChatMessage } from '../models';
import { EventDocAiChatHistoryFile } from '../types/EventDocAiChatHistoryFile';
import { eventDocAiChatHistoryPath } from './eventDocAiChatHistoryPath';

export function* askEventDocAiChatHistorySave(docId: string, chatId: string, messages: EventDocAiChatMessage[]): AskResponse<void> {
  const drive = yield* askConfigGetGlobal<string>(EVENT_DOC_AI_CHAT_DRIVE_GLOBAL);
  const scope = yield* askEventDocResolveScope();

  const file: EventDocAiChatHistoryFile = { messages };

  yield* askFileWriteObjectJson(drive, eventDocAiChatHistoryPath(docId, chatId), file, undefined, scope);
}
