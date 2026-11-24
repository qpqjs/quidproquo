import { EventDocRoutesOptions } from './EventDocRoutesOptions';

/** Options for defineEventDoc; storeName/type come from the EventDocFunctions object. */
export type EventDocCollectionOptions = Omit<EventDocRoutesOptions, 'storeName' | 'type'> & {
  // Whether the collection's documents are deleted for good when the collection leaves the config. Unset means the
  // deployment decides, as it does for any store. See EventDocSummaryOptions.deleteOnRemove.
  deleteOnRemove?: boolean;
};
