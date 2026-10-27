import { AskResponse } from 'quidproquo-core';

import { askWebsocketProvideConnectionInfo } from '../../context/websocketConnectionInfoContext';
import { AnyWebSocketQueueEventMessage } from '../../types/AnyWebSocketQueueEventMessage';
import { askSendAnyWebSocketQueueEventMessageWithCorrelationToFrontend } from './askSendAnyWebSocketQueueEventMessageWithCorrelationToFrontend';

// Server-initiated broadcast to every live connection on the socket api. Unlike the
// correlation helper this does not need a websocket-triggered context — the caller
// names the api explicitly, so any story (storage event, queue handler, cron) can
// push to the frontend.
export function* askWebSocketQueueBroadcastMessage<E extends AnyWebSocketQueueEventMessage>(websocketApiName: string, message: E): AskResponse<void> {
  yield* askWebsocketProvideConnectionInfo({ apiName: websocketApiName }, askSendAnyWebSocketQueueEventMessageWithCorrelationToFrontend(message));
}
