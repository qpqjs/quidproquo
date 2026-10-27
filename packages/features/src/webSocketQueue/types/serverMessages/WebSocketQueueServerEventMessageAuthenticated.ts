import { WebSocketQueueEventMessage } from '../WebSocketQueueEventMessage';
import { WebSocketQueueServerMessageEventType } from './WebSocketQueueServerMessageEventType';

export type WebSocketQueueServerEventPayloadAuthenticated = undefined;

export type WebSocketQueueServerEventMessageAuthenticated = WebSocketQueueEventMessage<
  WebSocketQueueServerEventPayloadAuthenticated,
  WebSocketQueueServerMessageEventType.Authenticated
>;
