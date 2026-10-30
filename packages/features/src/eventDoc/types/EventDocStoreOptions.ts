/** A collection's identity minus the derivable bits; store and drive names are derived from `storeName`. */
export type EventDocStoreOptions = {
  storeName: string;
  type: string;
  onPublish?: string;
  onAppend?: string;
  scopeResolver?: string;
  authorise?: string;
  syncWebsocketApiName?: string | string[];
};
