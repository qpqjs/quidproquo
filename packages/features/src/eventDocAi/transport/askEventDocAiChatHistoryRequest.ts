import { AskResponse } from '@qpqjs/core';

import { askEventDocAiServiceRequest } from '../logic/askEventDocAiServiceRequest';
import type { EventDocAiChatHistoryPayload, EventDocAiChatMessage } from '../models';
import { EVENT_DOC_AI_METHOD_CHAT_HISTORY } from '../module/constants/eventDocAiMethodNames';

export function* askEventDocAiChatHistoryRequest(payload: EventDocAiChatHistoryPayload): AskResponse<EventDocAiChatMessage[]> {
  return yield* askEventDocAiServiceRequest<EventDocAiChatMessage[], EventDocAiChatHistoryPayload>(EVENT_DOC_AI_METHOD_CHAT_HISTORY, payload);
}
