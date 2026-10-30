import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import type { EventDocAiChatMessage } from '../../models';
import type { EventDocAiAppendChatMessageEffect } from '../effects/EventDocAiAppendChatMessageEffect';
import { EventDocAiEffect } from '../effects/EventDocAiEffect';

export function* askEventDocAiAppendChatMessage(message: EventDocAiChatMessage): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocAiAppendChatMessageEffect>(EventDocAiEffect.AppendChatMessage, { message });
}
