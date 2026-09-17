import { EventDocVersion } from './EventDocVersion';

/**
 * A resolved version with the latest-shaped document state at its head. `TState` is the folded document type when the
 * reader knows it (a backend built from a typed definition); the raw log stories fold to `unknown`.
 */
export type EventDocVersionState<TState = unknown> = {
  version: EventDocVersion;
  state: TState;
};
