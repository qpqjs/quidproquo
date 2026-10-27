import { WebSocketQueueEventMessage } from '../WebSocketQueueEventMessage';
import { WebSocketQueueServerMessageEventType } from './WebSocketQueueServerMessageEventType';

export type WebSocketQueueServerEventPayloadStateDispatch = unknown;

export type WebSocketQueueServerEventMessageStateDispatch = WebSocketQueueEventMessage<
  WebSocketQueueServerEventPayloadStateDispatch,
  WebSocketQueueServerMessageEventType.StateDispatch
>;
