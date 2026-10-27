import { WebSocketQueueEventMessage } from '../WebSocketQueueEventMessage';
import { WebSocketQueueServerMessageEventType } from './WebSocketQueueServerMessageEventType';

export type WebSocketQueueServerEventPayloadUnauthenticated = undefined;

export type WebSocketQueueServerEventMessageUnauthenticated = WebSocketQueueEventMessage<
  WebSocketQueueServerEventPayloadUnauthenticated,
  WebSocketQueueServerMessageEventType.Unauthenticated
>;
