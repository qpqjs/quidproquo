import { EventDocRoutesOptions } from './EventDocRoutesOptions';

/** Options for defineEventDoc; storeName/type come from the EventDocFunctions object. */
export type EventDocCollectionOptions = Omit<EventDocRoutesOptions, 'storeName' | 'type'>;
