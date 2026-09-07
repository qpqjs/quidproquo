// Key layout of an offloaded snapshot blob in the collection's storage drive:
// `<docId>/snapshots/<viewName>/<eventId>` — beside the doc's `<docId>/assets/...` prefix
// (see eventDocAssetPath). Every path segment comes off the snapshot ROW's own keys
// (eventDocSnapshotPk decomposed + sk), which is why an EventDocSnapshot of type
// 'storageDrive' stores no path: deriving it here means a row and its blob cannot drift.
// Swapping this scheme touches only this file.
export const eventDocSnapshotPath = (docId: string, viewName: string, eventId: number): string => `${docId}/snapshots/${viewName}/${eventId}`;
