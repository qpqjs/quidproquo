import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocAiEffect } from '../effects/EventDocAiEffect';
import type { EventDocAiSetLoadingHistoryEffect } from '../effects/EventDocAiSetLoadingHistoryEffect';

export function* askEventDocAiSetLoadingHistory(isLoading: boolean): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocAiSetLoadingHistoryEffect>(EventDocAiEffect.SetLoadingHistory, { isLoading });
}
