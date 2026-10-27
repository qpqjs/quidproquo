import { WebSocketQueueEventMessage } from '../WebSocketQueueEventMessage';
import { WebSocketQueueServerMessageEventType } from './WebSocketQueueServerMessageEventType';

export type WebSocketQueueServerEventPayloadServiceRequestResponse = unknown;

export type WebSocketQueueServerEventMessageServiceRequestResponse = WebSocketQueueEventMessage<
  WebSocketQueueServerEventPayloadServiceRequestResponse,
  WebSocketQueueServerMessageEventType.ServiceRequestResponse
>;
