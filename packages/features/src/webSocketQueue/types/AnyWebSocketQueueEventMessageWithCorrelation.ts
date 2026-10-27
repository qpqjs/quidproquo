import { AnyWebSocketQueueEventMessage } from './AnyWebSocketQueueEventMessage';
import { WebSocketQueueEventMessageWithCorrelation } from './WebSocketQueueEventMessageWithCorrelation';

export type AnyWebSocketQueueEventMessageWithCorrelation = WebSocketQueueEventMessageWithCorrelation<AnyWebSocketQueueEventMessage>;
