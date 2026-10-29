import { AskResponse } from '@qpqjs/core';

import { askAdminWebSocketBroadcast } from './askAdminWebSocketBroadcast';
import { WebSocketQueueQpqAdminServerEventMessageTraceDone, WebSocketQueueQpqAdminServerMessageEventType } from './serverMessages';

// Broadcast "trace finished" to every connected admin client. The client watching
// that correlation re-requests the trace route for the stored trace's signed url.
export function* askLogSendTraceDoneToAdmins(correlation: string, succeeded: boolean, errorText?: string): AskResponse<void> {
  const traceDoneMessage: WebSocketQueueQpqAdminServerEventMessageTraceDone = {
    type: WebSocketQueueQpqAdminServerMessageEventType.TraceDone,
    payload: {
      correlation,
      succeeded,
      errorText,
    },
  };

  yield* askAdminWebSocketBroadcast(traceDoneMessage);
}
