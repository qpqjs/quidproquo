import { EventDocVersion } from './EventDocVersion';

/** A resolved version with the latest-shaped document state at its head. */
export type EventDocVersionState = {
  version: EventDocVersion;
  state: unknown;
};
