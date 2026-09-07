/**
 * Snapshots store name derived from the collection's storeName. The suffix is short because store names are compounded into
 * physical resource names (table, stream, handler ids) that already carry app, environment and service.
 */
export const eventDocSnapshotsStoreName = (storeName: string): string => `${storeName}Snap`;
