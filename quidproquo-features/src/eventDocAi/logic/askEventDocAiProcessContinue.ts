import { AskResponse } from 'quidproquo-core';

import type { ServiceRequestDeferred } from '../../webSocketQueue/logic/service';
import { askEventDocAiChatHistoryLoad } from '../data/askEventDocAiChatHistoryLoad';
import type { EventDocAiChatSendResult } from '../models';
import { askEventDocAiStreamTurn } from './askEventDocAiStreamTurn';

/**
 * Resumes a turn a previous execution handed off. The saved history already ends
 * on the partial assistant reply, so the model picks up from its own recorded
 * tool calls and results.
 */
export function* askEventDocAiProcessContinue(
  docId: string,
  chatId: string,
  lengthResumes: number,
): AskResponse<EventDocAiChatSendResult | ServiceRequestDeferred> {
  const history = yield* askEventDocAiChatHistoryLoad(docId, chatId);

  return yield* askEventDocAiStreamTurn(docId, chatId, history, { isContinuation: true, lengthResumes });
}
