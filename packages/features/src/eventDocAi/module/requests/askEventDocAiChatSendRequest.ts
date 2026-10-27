import { AskResponse } from 'quidproquo-core';

import type { EventDocAiChatSendPayload, EventDocAiChatSendResult } from '../../models';
import { EVENT_DOC_AI_METHOD_CHAT_SEND } from '../constants/eventDocAiMethodNames';
import { askEventDocAiServiceRequest } from '../logic/askEventDocAiServiceRequest';

export function* askEventDocAiChatSendRequest(payload: EventDocAiChatSendPayload): AskResponse<EventDocAiChatSendResult> {
  return yield* askEventDocAiServiceRequest<EventDocAiChatSendPayload, EventDocAiChatSendResult>(EVENT_DOC_AI_METHOD_CHAT_SEND, payload);
}
