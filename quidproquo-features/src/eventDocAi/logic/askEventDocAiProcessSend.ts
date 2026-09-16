import { askConfigGetGlobal, AskResponse } from 'quidproquo-core';

import { EVENT_DOC_STORAGE_DRIVE_GLOBAL } from '../../eventDoc';
import type { ServiceRequestDeferred } from '../../webSocketQueue/logic/service';
import { askEventDocAiChatHistoryLoad } from '../data/askEventDocAiChatHistoryLoad';
import { askEventDocAiChatHistorySave } from '../data/askEventDocAiChatHistorySave';
import type { EventDocAiAttachment, EventDocAiChatSendResult } from '../models';
import { makeEventDocAiUserMessage } from '../module';
import { askEventDocAiAttachmentsValidate } from './askEventDocAiAttachmentsValidate';
import { askEventDocAiStreamTurn } from './askEventDocAiStreamTurn';

/**
 * A new conversational turn: validates the attachments, saves the user message
 * (so a refresh mid-reply still shows the question), then streams the reply.
 */
export function* askEventDocAiProcessSend(
  docId: string,
  chatId: string,
  message: string,
  attachments: EventDocAiAttachment[] = [],
): AskResponse<EventDocAiChatSendResult | ServiceRequestDeferred> {
  // Attachments are doc assets — they live on the collection's storage drive
  // (uploaded via the eventDoc asset routes), not the chat-history drive.
  const docStorageDrive = yield* askConfigGetGlobal<string>(EVENT_DOC_STORAGE_DRIVE_GLOBAL);

  yield* askEventDocAiAttachmentsValidate(docStorageDrive, docId, attachments);

  const history = [...(yield* askEventDocAiChatHistoryLoad(docId, chatId)), makeEventDocAiUserMessage(message, attachments)];

  yield* askEventDocAiChatHistorySave(docId, chatId, history);

  return yield* askEventDocAiStreamTurn(docId, chatId, history, false);
}
