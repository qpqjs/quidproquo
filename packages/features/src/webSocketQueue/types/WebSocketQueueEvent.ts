import { QueueEvent, QueueMessage } from 'quidproquo-core';

export type WebSocketQueueEvent<EventType, Payload> = QueueEvent<
  {
    type: EventType;
  } & QueueMessage<Payload>
>;
