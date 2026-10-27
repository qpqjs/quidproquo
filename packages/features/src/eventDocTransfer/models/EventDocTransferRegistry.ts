import { EventDocTransferCollection } from './EventDocTransferCollection';

/** The service name EventDocLinks use for this service and the collections it owns; read once per request and threaded explicitly. */
export type EventDocTransferRegistry = {
  service: string;
  collections: EventDocTransferCollection[];
};
