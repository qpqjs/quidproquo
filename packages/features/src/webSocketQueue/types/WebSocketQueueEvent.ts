import { QueueEvent, QueueMessage } from '@qpqjs/core';

export type WebSocketQueueEvent<EventType, Payload> = QueueEvent<
  {
    type: EventType;
  } & QueueMessage<Payload>
>;
