/** Reference to an immutable asset blob (`<docId>/assets/<guid>`) plus its original filename and mimetype, recorded in an event. */
export type EventDocAssetRef = {
  guid: string;
  filename: string;
  mimetype: string;
};
