import { AskResponse } from '@qpqjs/core';

import type { ServiceRequestDeferred } from '../../webSocketQueue/logic/service';
import type { EventDocAiChatSendResult } from '../models';
import { askEventDocAiChatMessagesLoad } from './askEventDocAiChatMessagesLoad';
import { askEventDocAiProvideChat } from './askEventDocAiProvideChat';
import { askEventDocAiStreamTurn } from './askEventDocAiStreamTurn';

/**
 * Resumes a turn a previous execution handed off. The saved chat already ends
 * on the partial assistant reply, so the model picks up from its own recorded
 * tool calls and results.
 */
export function* askEventDocAiProcessContinue(
  docId: string,
  chatId: string,
  lengthResumes: number,
): AskResponse<EventDocAiChatSendResult | ServiceRequestDeferred> {
  const history = yield* askEventDocAiChatMessagesLoad(docId, chatId);

  return yield* askEventDocAiProvideChat(chatId, askEventDocAiStreamTurn(docId, chatId, history, { isContinuation: true, lengthResumes }));
}
