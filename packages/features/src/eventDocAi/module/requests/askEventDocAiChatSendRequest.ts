import { AskResponse } from '@qpqjs/core';

import type { EventDocAiChatSendPayload, EventDocAiChatSendResult } from '../../models';
import { EVENT_DOC_AI_METHOD_CHAT_SEND } from '../constants/eventDocAiMethodNames';
import { askEventDocAiServiceRequest } from '../logic/askEventDocAiServiceRequest';

export function* askEventDocAiChatSendRequest(payload: EventDocAiChatSendPayload): AskResponse<EventDocAiChatSendResult> {
  return yield* askEventDocAiServiceRequest<EventDocAiChatSendResult, EventDocAiChatSendPayload>(EVENT_DOC_AI_METHOD_CHAT_SEND, payload);
}
