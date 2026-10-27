import { EventMessage } from '@qpqjs/core';

export type WebSocketQueueEventMessage<P, T extends string> = EventMessage<P, T>;
