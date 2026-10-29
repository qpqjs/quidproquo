import { EventDocEventOrigin } from './EventDocEventOrigin';

/** Options shared by the single and batch appends (their defaults differ). */
export type EventDocEventAppendOptions = {
  // Run the registered validator against the state at head before the write. True at the client boundary
  // (the append route); server writers may skip it, but should set it when other writers can touch the document.
  validate: boolean;
  // Who authored the event. A client append refuses the collection's server-only types before anything is written;
  // only trusted server code passes `server`. Defaults to client, so a caller that forgets is refused, never trusted.
  origin?: EventDocEventOrigin;
};
