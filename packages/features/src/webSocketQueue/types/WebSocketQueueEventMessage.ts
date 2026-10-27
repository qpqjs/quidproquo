import { EventMessage } from 'quidproquo-core';

export type WebSocketQueueEventMessage<P, T extends string> = EventMessage<P, T>;
