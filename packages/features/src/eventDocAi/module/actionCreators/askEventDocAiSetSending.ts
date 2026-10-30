import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocAiEffect } from '../effects/EventDocAiEffect';
import type { EventDocAiSetSendingEffect } from '../effects/EventDocAiSetSendingEffect';

export function* askEventDocAiSetSending(isSending: boolean): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocAiSetSendingEffect>(EventDocAiEffect.SetSending, { isSending });
}
