import { AskResponse, askStateDispatchEffect, StoryResultMetadata } from 'quidproquo-core';

import { VolatileEffect } from '../../effects/volatile/VolatileEffect';
import { VolatileRealtimeErrorLogReceivedEffect } from '../../effects/volatile/VolatileRealtimeErrorLogReceivedEffect';

export function* askUIVolatileRealtimeErrorLogReceived(log: StoryResultMetadata): AskResponse<void> {
  yield* askStateDispatchEffect<VolatileRealtimeErrorLogReceivedEffect>(VolatileEffect.realtimeErrorLogReceived, log);
}
