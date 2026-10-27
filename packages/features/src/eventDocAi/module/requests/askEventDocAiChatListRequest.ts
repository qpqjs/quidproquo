import { AskResponse } from 'quidproquo-core';

import type { EventDocAiChatListPayload, EventDocAiChatSummary } from '../../models';
import { EVENT_DOC_AI_METHOD_CHAT_LIST } from '../constants/eventDocAiMethodNames';
import { askEventDocAiServiceRequest } from '../logic/askEventDocAiServiceRequest';

export function* askEventDocAiChatListRequest(): AskResponse<EventDocAiChatSummary[]> {
  return yield* askEventDocAiServiceRequest<EventDocAiChatListPayload, EventDocAiChatSummary[]>(EVENT_DOC_AI_METHOD_CHAT_LIST, {});
}
