import { AskResponse, askStateDispatchEffect, StoryResultMetadata } from '@qpqjs/core';

import { VolatileEffect } from '../../effects/volatile/VolatileEffect';
import { VolatileRealtimeErrorLogReceivedEffect } from '../../effects/volatile/VolatileRealtimeErrorLogReceivedEffect';

export function* askVolatileRealtimeErrorLogReceived(log: StoryResultMetadata): AskResponse<void> {
  yield* askStateDispatchEffect<VolatileRealtimeErrorLogReceivedEffect>(VolatileEffect.realtimeErrorLogReceived, log);
}
