import type { EventDocEvent } from '../models';

// Only place that knows pk=modelId / sk=eventId, keeping the domain event free of
// storage concerns.
//
// `type` is the COLLECTION type, not the event type. It is denormalised onto every row
// because one events table can host several collections (EventDocStore.type pins which),
// and a change-data-capture consumer sees only the row: nothing else in the log says which
// collection a document belongs to, so a projector could not know which summary to rebuild.
export type EventDocStoredEvent = {
  pk: string;
  sk: number;
  type: string;
  data: EventDocEvent;
};
