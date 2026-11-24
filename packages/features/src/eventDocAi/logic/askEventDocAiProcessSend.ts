import { askConfigGetGlobal, AskResponse } from '@qpqjs/core';

import { EVENT_DOC_STORAGE_DRIVE_GLOBAL } from '../../eventDoc';
import type { ServiceRequestDeferred } from '../../webSocketQueue/logic/service';
import type { EventDocAiAttachment, EventDocAiChatSendResult } from '../models';
import { makeEventDocAiUserMessage } from '../module';
import { askEventDocAiAttachmentsValidate } from './askEventDocAiAttachmentsValidate';
import { askEventDocAiChatMessagesAppend } from './askEventDocAiChatMessagesAppend';
import { askEventDocAiChatMessagesLoad } from './askEventDocAiChatMessagesLoad';
import { askEventDocAiProvideChat } from './askEventDocAiProvideChat';
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
  // Attachments are doc assets, they live on the collection's storage drive
  // (uploaded via the eventDoc asset routes), not on a chat drive.
  const docStorageDrive = yield* askConfigGetGlobal<string>(EVENT_DOC_STORAGE_DRIVE_GLOBAL);

  yield* askEventDocAiAttachmentsValidate(docStorageDrive, docId, attachments);

  yield* askEventDocAiChatMessagesAppend(docId, chatId, [makeEventDocAiUserMessage(message, attachments)]);

  const history = yield* askEventDocAiChatMessagesLoad(docId, chatId);

  return yield* askEventDocAiProvideChat(chatId, askEventDocAiStreamTurn(docId, chatId, history, { isContinuation: false, lengthResumes: 0 }));
}
