import { AskResponse } from '@qpqjs/core';

import { askWebsocketConnectionInfoProvide } from '../../context';
import { AnyWebSocketQueueEventMessage } from '../../types/AnyWebSocketQueueEventMessage';
import { askWebSocketQueueSendEventMessageWithCorrelationToFrontend } from './askWebSocketQueueSendEventMessageWithCorrelationToFrontend';

// Server-initiated broadcast to every live connection on the socket api. Unlike the
// correlation helper this does not need a websocket-triggered context, the caller
// names the api explicitly, so any story (storage event, queue handler, cron) can
// push to the frontend.
export function* askWebSocketQueueBroadcastMessage<E extends AnyWebSocketQueueEventMessage>(websocketApiName: string, message: E): AskResponse<void> {
  yield* askWebsocketConnectionInfoProvide({ apiName: websocketApiName }, askWebSocketQueueSendEventMessageWithCorrelationToFrontend(message));
}
