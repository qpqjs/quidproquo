import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import type { EventDocAiChatMessage } from '../../models';
import { EventDocAiEffect } from '../effects/EventDocAiEffect';
import type { EventDocAiSetMessagesEffect } from '../effects/EventDocAiSetMessagesEffect';

export function* askEventDocAiSetMessages(messages: EventDocAiChatMessage[]): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocAiSetMessagesEffect>(EventDocAiEffect.SetMessages, { messages });
}
