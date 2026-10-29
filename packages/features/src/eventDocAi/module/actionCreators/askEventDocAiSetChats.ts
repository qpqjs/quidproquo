import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import type { EventDocAiChatSummary } from '../../models';
import { EventDocAiEffect } from '../effects/EventDocAiEffect';
import type { EventDocAiSetChatsEffect } from '../effects/EventDocAiSetChatsEffect';

export function* askEventDocAiSetChats(chats: EventDocAiChatSummary[]): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocAiSetChatsEffect>(EventDocAiEffect.SetChats, { chats });
}
