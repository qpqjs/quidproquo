import { EVENT_DOC_TRANSFER_COLLECTIONS_GLOBAL, EVENT_DOC_TRANSFER_SCOPE_RESOLVER_GLOBAL, EVENT_DOC_TRANSFER_SERVICE_GLOBAL } from '../constants';
import { EventDocTransferCollection } from '../models';

/** Input to buildEventDocTransferGlobals. */
export type EventDocTransferGlobalsOptions = {
  service: string;
  collections: EventDocTransferCollection[];
  scopeResolver?: string;
};

/** The per-route globals askEventDocTransferReadRegistry reads back. Optional fields are always set ('' when unconfigured). */
export const buildEventDocTransferGlobals = ({ service, collections, scopeResolver }: EventDocTransferGlobalsOptions): Record<string, unknown> => ({
  [EVENT_DOC_TRANSFER_SERVICE_GLOBAL]: service,
  [EVENT_DOC_TRANSFER_COLLECTIONS_GLOBAL]: collections.map(({ storeName, type, onPublish, onAppend }) => ({
    storeName,
    type,
    onPublish: onPublish ?? '',
    onAppend: onAppend ?? '',
  })),
  [EVENT_DOC_TRANSFER_SCOPE_RESOLVER_GLOBAL]: scopeResolver ?? '',
});
