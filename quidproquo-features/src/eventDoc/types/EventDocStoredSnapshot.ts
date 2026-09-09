import type { EventDocSnapshot } from '../models';

/** A snapshot row: pk=docId#viewName, sk=eventId, so "latest at or before N for this view" is a descending sort-key range. */
export type EventDocStoredSnapshot = {
  pk: string;
  sk: number;
  // The collection type, denormalised as on EventDocStoredEvent.
  type: string;
  data: EventDocSnapshot;
};

/** The composed partition key. '#' cannot collide: doc ids are guids and view names are identifiers. */
export const eventDocSnapshotPk = (docId: string, viewName: string): string => `${docId}#${viewName}`;
