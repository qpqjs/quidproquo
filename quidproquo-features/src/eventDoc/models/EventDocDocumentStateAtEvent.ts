/**
 * The document view as of one event, latest-shaped. `TState` is the folded document type when the reader knows it (a
 * backend built from a typed definition); the raw log stories fold to `unknown`.
 */
export type EventDocDocumentStateAtEvent<TState = unknown> = {
  eventId: number;
  state: TState;
};
