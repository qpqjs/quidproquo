import { QpqIsoDateTime } from 'quidproquo-core';

import type { EventDocEventActor } from './EventDocEventActor';

// Provenance carried by every event-doc event. Split by ownership: the
// client supplies version + clientMessageId; the server stamps createdBy,
// createdAt, and eventId (the latter mirrors the storage sort key).
//
// `eventId` is the event's CONTIGUOUS position in the document's log: INIT_STATE is 0 and
// every append is head + 1, claimed by a conditional write (askEventDocEventAppend). Log
// order IS commit order, so a cursor "after N" is airtight and a snapshot "at N" holds
// exactly events 0..N. It is the storage sort key too.
export type EventDocEventMetadata = {
  version: number;
  clientMessageId: string;
  createdBy: EventDocEventActor;
  createdAt: QpqIsoDateTime;
  eventId: number;
};
