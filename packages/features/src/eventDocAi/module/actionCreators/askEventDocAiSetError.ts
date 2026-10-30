import type { Nullable } from '@qpqjs/core';
import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocAiEffect } from '../effects/EventDocAiEffect';
import type { EventDocAiSetErrorEffect } from '../effects/EventDocAiSetErrorEffect';

export function* askEventDocAiSetError(error: Nullable<string>): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocAiSetErrorEffect>(EventDocAiEffect.SetError, { error });
}
