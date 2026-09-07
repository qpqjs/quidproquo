/** Blob key of an offloaded snapshot: `<docId>/snapshots/<viewName>/<eventId>`. Derived from the row's own keys, so no path is stored. */
export const eventDocSnapshotPath = (docId: string, viewName: string, eventId: number): string => `${docId}/snapshots/${viewName}/${eventId}`;
