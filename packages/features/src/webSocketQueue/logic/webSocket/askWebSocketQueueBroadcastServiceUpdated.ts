import { AskResponse } from 'quidproquo-core';

import { WebSocketQueueServerEventMessageServiceUpdated } from '../../types/serverMessages/WebSocketQueueServerEventMessageServiceUpdated';
import { WebSocketQueueServerMessageEventType } from '../../types/serverMessages/WebSocketQueueServerMessageEventType';
import { askWebSocketQueueBroadcastMessage } from './askWebSocketQueueBroadcastMessage';

// Tell every connected frontend that a service's deployed artifacts changed (e.g. a
// new views bundle is live) so they can offer a module reload.
export function* askWebSocketQueueBroadcastServiceUpdated(websocketApiName: string, serviceName: string): AskResponse<void> {
  yield* askWebSocketQueueBroadcastMessage<WebSocketQueueServerEventMessageServiceUpdated>(websocketApiName, {
    type: WebSocketQueueServerMessageEventType.ServiceUpdated,
    payload: { serviceName },
  });
}
