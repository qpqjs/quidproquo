import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import type { EventDocAiClearStreamEffect } from '../effects/EventDocAiClearStreamEffect';
import { EventDocAiEffect } from '../effects/EventDocAiEffect';

export function* askEventDocAiClearStream(): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocAiClearStreamEffect>(EventDocAiEffect.ClearStream, {});
}
