import { AskResponse } from '@qpqjs/core';

import {
  AnyWebSocketQueueEventMessageWithCorrelation,
  WebSocketQueueClientEventMessagePing,
  WebSocketQueueClientMessageEventType,
  WebSocketQueueServerEventMessagePong,
  WebSocketQueueServerMessageEventType,
} from '../../../types';
import { askWebSocketQueueSendMessage } from '../askWebSocketQueueSendMessage';

export function isWebSocketPingMessage(event: AnyWebSocketQueueEventMessageWithCorrelation): event is WebSocketQueueClientEventMessagePing {
  return event.type === WebSocketQueueClientMessageEventType.Ping;
}

export function* askWebSocketQueueProcessPing(id: string): AskResponse<void> {
  const pongMessage: WebSocketQueueServerEventMessagePong = {
    type: WebSocketQueueServerMessageEventType.Pong,
  };

  yield* askWebSocketQueueSendMessage(id, pongMessage);
}
