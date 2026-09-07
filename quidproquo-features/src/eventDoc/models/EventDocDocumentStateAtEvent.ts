// The document view resolved as of one event: latest-shaped state plus the event it is
// current to (the state's clock for anything downstream that needs to cite it).
export type EventDocDocumentStateAtEvent = {
  eventId: number;
  state: unknown;
};
