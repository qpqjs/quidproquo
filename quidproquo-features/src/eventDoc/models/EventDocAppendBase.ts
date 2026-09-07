import { Nullable } from 'quidproquo-core';

import type { EventDocDocumentStateAtEvent } from './EventDocDocumentStateAtEvent';

/**
 * Where an append lands: it claims `headEventId + 1`. `state` is the document as of that head when the append is
 * validated, null when nothing validates it (server-authored appends, or a collection with no functions object).
 */
export type EventDocAppendBase = {
  headEventId: number;
  state: Nullable<EventDocDocumentStateAtEvent>;
};
