import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocAiEffect } from '../effects/EventDocAiEffect';
import type { EventDocAiSetLoadingHistoryEffect } from '../effects/EventDocAiSetLoadingHistoryEffect';

export function* askUIEventDocAiSetLoadingHistory(isLoading: boolean): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocAiSetLoadingHistoryEffect>(EventDocAiEffect.SetLoadingHistory, { isLoading });
}
