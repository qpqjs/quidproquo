import { AskResponse, QpqPagedData } from 'quidproquo-core';

import { EventDocEvent, EventDocEventInput } from '../../models';
import { EventDocWorkspaceBootstrap } from './EventDocWorkspaceBootstrap';
import { EventDocWorkspaceDocumentIdentity } from './EventDocWorkspaceDocumentIdentity';

// One page of the saved log, for display reads that keep their own cursor (the history
// panel: newestFirst + limit for the latest page, then nextPageKey to walk older).
export type EventDocWorkspaceEventsPageRequest = {
  limit?: number;
  nextPageKey?: string;
  afterEventId?: number;
  newestFirst?: boolean;
};

// How the workspace reaches the event-doc backend. Injected rather than hard-wired:
// this package can't depend on a specific HTTP client, so the web app passes stories
// built on askApiRequest, tests pass fakes, other hosts bring their own.
// `askFetchBootstrap` is the opening load: the newest snapshot base plus only the
// events after it (base: null + full log when the server has no usable snapshot).
// `askFetchEvents` with `afterEventId` (exclusive) returns only the tail, keeping
// refresh incremental. `askFetchEventsPage` is a single page with the cursor kept —
// the history panel's paged, newest-first read.
export type EventDocWorkspaceTransport = {
  askFetchBootstrap: (identity: EventDocWorkspaceDocumentIdentity) => AskResponse<EventDocWorkspaceBootstrap>;
  askFetchEvents: (identity: EventDocWorkspaceDocumentIdentity, afterEventId?: number) => AskResponse<EventDocEvent[]>;
  askFetchEventsPage: (
    identity: EventDocWorkspaceDocumentIdentity,
    request?: EventDocWorkspaceEventsPageRequest,
  ) => AskResponse<QpqPagedData<EventDocEvent>>;
  askAppendEvent: (identity: EventDocWorkspaceDocumentIdentity, input: EventDocEventInput) => AskResponse<EventDocEvent>;
};
