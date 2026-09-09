import type { EventDocEventMetadata } from './EventDocEventMetadata';

/** The payload the client sends: the full payload minus the fields the server stamps (eventId, createdAt, createdBy). */
export type ClientEventDocEventPayload<T = unknown> = {
  data: T;
  metadata: Omit<EventDocEventMetadata, 'eventId' | 'createdAt' | 'createdBy'>;
};
