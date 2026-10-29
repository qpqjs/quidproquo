import type { Nullable } from '@qpqjs/core';
import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocAiEffect } from '../effects/EventDocAiEffect';
import type { EventDocAiSetActiveChatEffect } from '../effects/EventDocAiSetActiveChatEffect';

export function* askEventDocAiSetActiveChat(chatId: Nullable<string>): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocAiSetActiveChatEffect>(EventDocAiEffect.SetActiveChat, { chatId });
}
