import { AskResponse } from '@qpqjs/core';

import type { EventDocAiChatCreatePayload, EventDocAiChatSummary } from '../../models';
import { EVENT_DOC_AI_METHOD_CHAT_CREATE } from '../constants/eventDocAiMethodNames';
import { askEventDocAiServiceRequest } from '../logic/askEventDocAiServiceRequest';

export function* askEventDocAiChatCreateRequest(payload: EventDocAiChatCreatePayload = {}): AskResponse<EventDocAiChatSummary> {
  return yield* askEventDocAiServiceRequest<EventDocAiChatSummary, EventDocAiChatCreatePayload>(EVENT_DOC_AI_METHOD_CHAT_CREATE, payload);
}
