import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocAiEffect } from '../effects/EventDocAiEffect';
import type { EventDocAiSetLoadingChatsEffect } from '../effects/EventDocAiSetLoadingChatsEffect';

export function* askUIEventDocAiSetLoadingChats(isLoading: boolean): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocAiSetLoadingChatsEffect>(EventDocAiEffect.SetLoadingChats, { isLoading });
}
