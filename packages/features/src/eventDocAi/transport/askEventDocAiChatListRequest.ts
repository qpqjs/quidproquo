import { AskResponse } from '@qpqjs/core';

import { askEventDocAiServiceRequest } from '../logic/askEventDocAiServiceRequest';
import type { EventDocAiChatListPayload, EventDocAiChatSummary } from '../models';
import { EVENT_DOC_AI_METHOD_CHAT_LIST } from '../module/constants/eventDocAiMethodNames';

export function* askEventDocAiChatListRequest(): AskResponse<EventDocAiChatSummary[]> {
  return yield* askEventDocAiServiceRequest<EventDocAiChatSummary[], EventDocAiChatListPayload>(EVENT_DOC_AI_METHOD_CHAT_LIST, {});
}
