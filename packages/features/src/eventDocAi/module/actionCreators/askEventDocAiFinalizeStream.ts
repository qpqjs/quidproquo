import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocAiEffect } from '../effects/EventDocAiEffect';
import type { EventDocAiFinalizeStreamEffect, FinalizeStreamPayload } from '../effects/EventDocAiFinalizeStreamEffect';

/** Turns the reply streamed so far into a finalized message of the chat. */
export function* askEventDocAiFinalizeStream(payload: FinalizeStreamPayload): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocAiFinalizeStreamEffect>(EventDocAiEffect.FinalizeStream, payload);
}
