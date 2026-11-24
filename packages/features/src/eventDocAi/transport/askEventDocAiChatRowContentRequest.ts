import { AskResponse } from '@qpqjs/core';

import { EVENT_DOC_AI_REQUEST_TIMEOUT_MS } from '../constants/eventDocAiRequestTimeoutMs';
import { askEventDocAiServiceRequest } from '../logic/askEventDocAiServiceRequest';
import type { EventDocAiChatRowContentPayload, EventDocAiChatRowContentResult } from '../models';
import { EVENT_DOC_AI_METHOD_CHAT_ROW_CONTENT } from '../module/constants/eventDocAiMethodNames';

/** A short-lived link to one chat row's stored content. */
export function* askEventDocAiChatRowContentRequest(payload: EventDocAiChatRowContentPayload): AskResponse<EventDocAiChatRowContentResult> {
  return yield* askEventDocAiServiceRequest<EventDocAiChatRowContentResult, EventDocAiChatRowContentPayload>(
    EVENT_DOC_AI_METHOD_CHAT_ROW_CONTENT,
    payload,
    { timeoutMs: EVENT_DOC_AI_REQUEST_TIMEOUT_MS },
  );
}
