import type { EventDocEventMetadata } from './EventDocEventMetadata';

/** The full payload a reducer folds: domain data plus complete provenance. */
export type EventDocEventPayload<T = unknown> = {
  data: T;
  metadata: EventDocEventMetadata;
};
