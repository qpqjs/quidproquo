import type { EventDocEvent } from '../models';

/** An event row: pk=modelId, sk=eventId. */
export type EventDocStoredEvent = {
  pk: string;
  sk: number;
  // The collection type, not the event type. Denormalised so a stream consumer holding only the row knows its collection.
  type: string;
  data: EventDocEvent;
};
