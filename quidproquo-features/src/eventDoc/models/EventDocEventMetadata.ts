import { QpqIsoDateTime } from 'quidproquo-core';

import type { EventDocEventActor } from './EventDocEventActor';

/**
 * Provenance on every event. The client supplies version and clientMessageId; the server stamps the rest.
 * `eventId` is the contiguous log position (INIT_STATE is 0, each append is head + 1) and the storage sort key.
 */
export type EventDocEventMetadata = {
  version: number;
  clientMessageId: string;
  createdBy: EventDocEventActor;
  createdAt: QpqIsoDateTime;
  eventId: number;
};
