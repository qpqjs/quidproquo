import { Nullable, QpqPagedData } from 'quidproquo-core';

import { EventDocEvent } from './EventDocEvent';
import { EventDocSnapshotBase } from './EventDocSnapshotBase';

/** The listEvents response with `includeBase`: a page of events plus the fold base they follow. Null base means the page starts at 0. */
export type EventDocEventBootstrapPage = QpqPagedData<EventDocEvent> & {
  base: Nullable<EventDocSnapshotBase>;
};
