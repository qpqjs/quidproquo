/** Where the dev server keeps a named resource's local stand-in: which service's store, and the key inside it. */
export type OwnedStoreLocation = {
  // The service whose local store holds the resource: its owner's, or this one.
  serviceName: string;
  // The key inside that store: the owner's override when it renamed the resource.
  key: string;
};
