import type { Nullable } from 'quidproquo-core';
import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { EventDocAiEffect } from '../effects/EventDocAiEffect';
import type { EventDocAiSetActiveChatEffect } from '../effects/EventDocAiSetActiveChatEffect';

export function* askUIEventDocAiSetActiveChat(chatId: Nullable<string>): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocAiSetActiveChatEffect>(EventDocAiEffect.SetActiveChat, { chatId });
}
