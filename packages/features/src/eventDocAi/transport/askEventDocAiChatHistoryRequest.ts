import { AskResponse } from '@qpqjs/core';

import { EVENT_DOC_AI_REQUEST_TIMEOUT_MS } from '../constants/eventDocAiRequestTimeoutMs';
import { askEventDocAiServiceRequest } from '../logic/askEventDocAiServiceRequest';
import type { EventDocAiChatHistoryPayload, EventDocAiChatHistoryResult } from '../models';
import { EVENT_DOC_AI_METHOD_CHAT_HISTORY } from '../module/constants/eventDocAiMethodNames';

/** One page of a chat's rows, oldest first: the newest page, or with `before` the page just before that row. */
export function* askEventDocAiChatHistoryRequest(payload: EventDocAiChatHistoryPayload): AskResponse<EventDocAiChatHistoryResult> {
  return yield* askEventDocAiServiceRequest<EventDocAiChatHistoryResult, EventDocAiChatHistoryPayload>(EVENT_DOC_AI_METHOD_CHAT_HISTORY, payload, {
    timeoutMs: EVENT_DOC_AI_REQUEST_TIMEOUT_MS,
  });
}
