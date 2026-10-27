import { WebSocketQueueEventMessage } from '../WebSocketQueueEventMessage';
import { WebSocketQueueServerMessageEventType } from './WebSocketQueueServerMessageEventType';

export type WebSocketQueueServerEventPayloadServiceUpdated = {
  /** The qpq service (module) whose deployed artifacts changed — e.g. a views bundle going live. */
  serviceName: string;
};

export type WebSocketQueueServerEventMessageServiceUpdated = WebSocketQueueEventMessage<
  WebSocketQueueServerEventPayloadServiceUpdated,
  WebSocketQueueServerMessageEventType.ServiceUpdated
>;
