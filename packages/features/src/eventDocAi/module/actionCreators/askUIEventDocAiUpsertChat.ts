import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import type { EventDocAiChatSummary } from '../../models';
import { EventDocAiEffect } from '../effects/EventDocAiEffect';
import type { EventDocAiUpsertChatEffect } from '../effects/EventDocAiUpsertChatEffect';

export function* askUIEventDocAiUpsertChat(chat: EventDocAiChatSummary): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocAiUpsertChatEffect>(EventDocAiEffect.UpsertChat, { chat });
}
