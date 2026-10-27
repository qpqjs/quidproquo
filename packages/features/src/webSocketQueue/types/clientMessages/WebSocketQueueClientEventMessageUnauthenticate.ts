import { WebSocketQueueEventMessage } from '../WebSocketQueueEventMessage';
import { WebSocketQueueClientMessageEventType } from './WebSocketQueueClientMessageEventType';

export type WebSocketQueueClientEventPayloadUnauthenticate = undefined;

export type WebSocketQueueClientEventMessageUnauthenticate = WebSocketQueueEventMessage<
  WebSocketQueueClientEventPayloadUnauthenticate,
  WebSocketQueueClientMessageEventType.Unauthenticate
>;
