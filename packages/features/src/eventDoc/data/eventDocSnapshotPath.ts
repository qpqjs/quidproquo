/**
 * Blob key of an offloaded snapshot: `<docId>/snapshots/<viewName>/<eventId>`, or `<docId>/snapshots/<cacheKey>/<viewName>/<eventId>`
 * under a non-empty cache key. Derived from the row's own keys, so no path is stored.
 */
export const eventDocSnapshotPath = (docId: string, viewName: string, eventId: number, snapshotCacheKey: string): string =>
  snapshotCacheKey ? `${docId}/snapshots/${snapshotCacheKey}/${viewName}/${eventId}` : `${docId}/snapshots/${viewName}/${eventId}`;
