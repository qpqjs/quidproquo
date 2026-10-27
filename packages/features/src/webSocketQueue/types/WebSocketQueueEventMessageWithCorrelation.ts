import { AnyWebSocketQueueEventMessage } from './AnyWebSocketQueueEventMessage';

export type WebSocketQueueEventMessageWithCorrelation<T extends AnyWebSocketQueueEventMessage> = T & {
  correlationId?: string;
};
