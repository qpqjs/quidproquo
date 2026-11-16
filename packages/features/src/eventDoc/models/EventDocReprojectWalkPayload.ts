import { EventDocReprojectSource } from './EventDocReprojectSource';

/** One step of a reproject walk: which source it reads, and where in it to resume (absent for the first page). */
export type EventDocReprojectWalkPayload = {
  source: EventDocReprojectSource;
  nextPageKey?: string;
};
