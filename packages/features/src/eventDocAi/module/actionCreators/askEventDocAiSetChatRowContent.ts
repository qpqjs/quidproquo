import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocAiEffect } from '../effects/EventDocAiEffect';
import type { EventDocAiSetChatRowContentEffect, SetChatRowContentPayload } from '../effects/EventDocAiSetChatRowContentEffect';

/** Puts content that was held in storage onto its row. */
export function* askEventDocAiSetChatRowContent(payload: SetChatRowContentPayload): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocAiSetChatRowContentEffect>(EventDocAiEffect.SetChatRowContent, payload);
}
