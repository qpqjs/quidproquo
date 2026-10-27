import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import type { EventDocAiChatSummary } from '../../models';
import { EventDocAiEffect } from '../effects/EventDocAiEffect';
import type { EventDocAiSetChatsEffect } from '../effects/EventDocAiSetChatsEffect';

export function* askUIEventDocAiSetChats(chats: EventDocAiChatSummary[]): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocAiSetChatsEffect>(EventDocAiEffect.SetChats, { chats });
}
