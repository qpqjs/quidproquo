import { AskResponse } from '@qpqjs/core';

import type { EventDocAiChatHistoryPayload, EventDocAiChatMessage } from '../../models';
import { EVENT_DOC_AI_METHOD_CHAT_HISTORY } from '../constants/eventDocAiMethodNames';
import { askEventDocAiServiceRequest } from '../logic/askEventDocAiServiceRequest';

export function* askEventDocAiChatHistoryRequest(payload: EventDocAiChatHistoryPayload): AskResponse<EventDocAiChatMessage[]> {
  return yield* askEventDocAiServiceRequest<EventDocAiChatMessage[], EventDocAiChatHistoryPayload>(EVENT_DOC_AI_METHOD_CHAT_HISTORY, payload);
}
