import type { EventDocEventPayload } from './EventDocEventPayload';

/** An event-doc event is a QPQ effect: type plus payload. `modelId` is routing (path and partition key), not carried here. */
export type EventDocEvent<T = unknown> = {
  type: string;
  payload: EventDocEventPayload<T>;
};
