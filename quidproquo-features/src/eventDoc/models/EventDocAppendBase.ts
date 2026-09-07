import { Nullable } from 'quidproquo-core';

import type { EventDocDocumentStateAtEvent } from './EventDocDocumentStateAtEvent';

// Where an append lands and what it is judged against. `headEventId` is the log's current
// head, so the append claims headEventId + 1. `state` is the document as of that head when
// the append is validated (the client boundary, on a collection with a registered
// definition), and null when nothing validates it (server-authored appends, or a
// collection with no functions object): a null state still carries the head, which is all
// the write needs.
export type EventDocAppendBase = {
  headEventId: number;
  state: Nullable<EventDocDocumentStateAtEvent>;
};
