/** One collection the transfer may read and write. A structural subset of EventDocRoutesOptions so one array can feed both. */
export type EventDocTransferCollection = {
  storeName: string;
  type: string;
  // Carried so the hooks fire after an import exactly as they do on the collection's own routes.
  onPublish?: string;
  onAppend?: string;
};
