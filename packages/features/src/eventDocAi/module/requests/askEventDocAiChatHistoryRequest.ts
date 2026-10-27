import { AskResponse } from 'quidproquo-core';

import type { EventDocAiChatHistoryPayload, EventDocAiChatMessage } from '../../models';
import { EVENT_DOC_AI_METHOD_CHAT_HISTORY } from '../constants/eventDocAiMethodNames';
import { askEventDocAiServiceRequest } from '../logic/askEventDocAiServiceRequest';

export function* askEventDocAiChatHistoryRequest(payload: EventDocAiChatHistoryPayload): AskResponse<EventDocAiChatMessage[]> {
  return yield* askEventDocAiServiceRequest<EventDocAiChatHistoryPayload, EventDocAiChatMessage[]>(EVENT_DOC_AI_METHOD_CHAT_HISTORY, payload);
}
