/** Blob key of an asset on the collection's storage drive: `<docId>/assets/<assetId>`. Assets are immutable; a re-upload is a new guid. */
export const eventDocAssetPath = (docId: string, assetId: string): string => `${docId}/assets/${assetId}`;

/** Prefix under which all of a doc's assets sit, for listing. */
export const eventDocAssetFolderPath = (docId: string): string => `${docId}/assets`;
