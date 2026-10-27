import { AskResponse, QpqPagedData } from 'quidproquo-core';

import { EventDocEvent, EventDocEventInput } from '../../models';
import { EventDocWorkspaceBootstrap } from './EventDocWorkspaceBootstrap';
import { EventDocWorkspaceDocumentIdentity } from './EventDocWorkspaceDocumentIdentity';

/** Options for a one-page read; afterEventId is exclusive, newestFirst walks the log backwards. */
export type EventDocWorkspaceEventsPageRequest = {
  limit?: number;
  nextPageKey?: string;
  afterEventId?: number;
  newestFirst?: boolean;
};

/**
 * How the workspace reaches the backend; injected so this package depends on no HTTP client. askFetchEvents with
 * afterEventId (exclusive) returns only the tail.
 */
export type EventDocWorkspaceTransport = {
  askFetchBootstrap: (identity: EventDocWorkspaceDocumentIdentity) => AskResponse<EventDocWorkspaceBootstrap>;
  askFetchEvents: (identity: EventDocWorkspaceDocumentIdentity, afterEventId?: number) => AskResponse<EventDocEvent[]>;
  askFetchEventsPage: (
    identity: EventDocWorkspaceDocumentIdentity,
    request?: EventDocWorkspaceEventsPageRequest,
  ) => AskResponse<QpqPagedData<EventDocEvent>>;
  askAppendEvent: (identity: EventDocWorkspaceDocumentIdentity, input: EventDocEventInput) => AskResponse<EventDocEvent>;
};
