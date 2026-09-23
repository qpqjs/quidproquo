import type { EventDocSnapshot } from '../models';

/**
 * A snapshot row: pk=docId#viewName[#cacheKey], sk=eventId, so "latest at or before N for this view" is a descending
 * sort-key range. The cache key is part of the pk on purpose: a reader under another key simply finds no rows, so stale
 * fold output is invisible without a compare step. Rows under old keys are left to persist.
 */
export type EventDocStoredSnapshot = {
  pk: string;
  sk: number;
  // The collection type, denormalised as on EventDocStoredEvent.
  type: string;
  data: EventDocSnapshot;
};

/**
 * The composed partition key. '#' cannot collide: doc ids are guids and view names are identifiers. An empty cache key
 * (the default) yields the legacy two-part pk so pre-existing rows stay addressable.
 */
export const eventDocSnapshotPk = (docId: string, viewName: string, snapshotCacheKey: string): string =>
  snapshotCacheKey ? `${docId}#${viewName}#${snapshotCacheKey}` : `${docId}#${viewName}`;
