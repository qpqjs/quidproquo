import type { Nullable } from 'quidproquo-core';
import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { EventDocAiEffect } from '../effects/EventDocAiEffect';
import type { EventDocAiSetErrorEffect } from '../effects/EventDocAiSetErrorEffect';

export function* askUIEventDocAiSetError(error: Nullable<string>): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocAiSetErrorEffect>(EventDocAiEffect.SetError, { error });
}
