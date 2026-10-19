import { WebSocketQueueEventMessage } from '../WebSocketQueueEventMessage';
import { WebSocketQueueClientMessageEventType } from './WebSocketQueueClientMessageEventType';

export type WebSocketQueueClientEventPayloadSubscribe = {
  // The topic to receive server pushes for, unscoped. The server files the subscription under the connection's
  // validated storage scope, so a client can never subscribe into another scope.
  topic: string;
};

export type WebSocketQueueClientEventMessageSubscribe = WebSocketQueueEventMessage<
  WebSocketQueueClientEventPayloadSubscribe,
  WebSocketQueueClientMessageEventType.Subscribe
>;
