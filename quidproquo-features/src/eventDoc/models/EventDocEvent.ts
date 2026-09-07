import type { EventDocEventPayload } from './EventDocEventPayload';

// A event-doc event IS a QPQ effect: a type discriminant plus a payload.
// The reducer folds it directly. `modelId` is NOT here — it is pure routing
// (the request path + the storage partition key); the log position is
// `payload.metadata.eventId`, which doubles as the storage sort key.
export type EventDocEvent<T = unknown> = {
  type: string;
  payload: EventDocEventPayload<T>;
};
