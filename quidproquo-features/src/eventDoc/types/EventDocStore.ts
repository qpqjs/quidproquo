/** A collection's identity, resolved from context so data functions never take store names. `type` pins the collection within a store. */
export type EventDocStore = {
  storeName: string;
  eventsStoreName: string;
  snapshotsStoreName: string;
  type: string;
  storageDriveName: string;
  // Inline-function names, see EventDocRoutesOptions.
  onPublish?: string;
  onAppend?: string;
  scopeResolver?: string;
  authorise?: string;
  // The websocket queue apis head-moved pushes go out on; empty means no pushes.
  syncWebsocketApiNames: string[];
};
