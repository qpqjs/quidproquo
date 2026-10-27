import { AskResponse } from 'quidproquo-core';

import {
  AnyWebSocketQueueEventMessageWithCorrelation,
  WebSocketQueueClientEventMessagePing,
  WebSocketQueueClientMessageEventType,
  WebSocketQueueServerEventMessagePong,
  WebSocketQueueServerMessageEventType,
} from '../../../types';
import { askSendMessage } from '../askSendMessage';

export function isWebSocketPingMessage(event: AnyWebSocketQueueEventMessageWithCorrelation): event is WebSocketQueueClientEventMessagePing {
  return event.type === WebSocketQueueClientMessageEventType.Ping;
}

export function* askProcessOnPing(id: string): AskResponse<void> {
  const pongMessage: WebSocketQueueServerEventMessagePong = {
    type: WebSocketQueueServerMessageEventType.Pong,
  };

  yield* askSendMessage(id, pongMessage);
}
