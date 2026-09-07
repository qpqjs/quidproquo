import type { EventDocSnapshot } from '../models';

// Only place that knows the snapshot store's key layout, keeping the domain model free of
// storage concerns — the twin of EventDocStoredEvent, which owns the event store's.
//
// pk composes the doc AND the view: snapshots are per-view, and one partition per
// (doc, view) makes "the latest snapshot at or before this event, for this view" a plain
// descending sort-key range — the exact read the incremental fold wants — while the sort
// key stays the SAME numeric event id the history table is ordered by, so a snapshot row
// and the event it captures always correlate by key alone.
//
// `type` is the COLLECTION type, denormalised for the same reason it is on every event
// row: one store can host several collections, and a reader holding only the row must
// know which one this snapshot belongs to.
export type EventDocStoredSnapshot = {
  pk: string;
  sk: number;
  type: string;
  data: EventDocSnapshot;
};

// The composed partition key. The '#' cannot collide: doc ids are guids and view names
// are identifiers, neither contains one.
export const eventDocSnapshotPk = (docId: string, viewName: string): string => `${docId}#${viewName}`;
