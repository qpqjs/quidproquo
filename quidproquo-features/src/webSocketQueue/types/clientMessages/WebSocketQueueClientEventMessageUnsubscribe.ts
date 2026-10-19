import { WebSocketQueueEventMessage } from '../WebSocketQueueEventMessage';
import { WebSocketQueueClientMessageEventType } from './WebSocketQueueClientMessageEventType';

export type WebSocketQueueClientEventPayloadUnsubscribe = {
  // The unscoped topic given to Subscribe.
  topic: string;
};

export type WebSocketQueueClientEventMessageUnsubscribe = WebSocketQueueEventMessage<
  WebSocketQueueClientEventPayloadUnsubscribe,
  WebSocketQueueClientMessageEventType.Unsubscribe
>;
