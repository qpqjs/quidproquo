import { AskResponse } from '@qpqjs/core';

import { EVENT_DOC_AI_REQUEST_TIMEOUT_MS } from '../constants/eventDocAiRequestTimeoutMs';
import { askEventDocAiServiceRequest } from '../logic/askEventDocAiServiceRequest';
import type { EventDocAiChatCreatePayload, EventDocAiChatSummary } from '../models';
import { EVENT_DOC_AI_METHOD_CHAT_CREATE } from '../module/constants/eventDocAiMethodNames';

export function* askEventDocAiChatCreateRequest(payload: EventDocAiChatCreatePayload = {}): AskResponse<EventDocAiChatSummary> {
  return yield* askEventDocAiServiceRequest<EventDocAiChatSummary, EventDocAiChatCreatePayload>(EVENT_DOC_AI_METHOD_CHAT_CREATE, payload, {
    timeoutMs: EVENT_DOC_AI_REQUEST_TIMEOUT_MS,
  });
}
