import { AskResponse, StoryResultMetadata } from '@qpqjs/core';

import { askVolatileRealtimeErrorLogReceived } from '../../actionCreators/volatile/askVolatileRealtimeErrorLogReceived';

// Websocket-pushed log metadata: only errors are kept, in the volatile slice:
// server data, not user intent, so it is not part of the session doc.
export function* askReceiveRealtimeErrorLog(log: StoryResultMetadata): AskResponse<void> {
  if (!log.error) {
    return;
  }

  yield* askVolatileRealtimeErrorLogReceived(log);
}
