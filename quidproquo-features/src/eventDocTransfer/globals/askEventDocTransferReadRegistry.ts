import { askConfigGetGlobal, AskResponse } from 'quidproquo-core';

import { EVENT_DOC_TRANSFER_COLLECTIONS_GLOBAL, EVENT_DOC_TRANSFER_SERVICE_GLOBAL } from '../constants';
import { EventDocTransferCollection, EventDocTransferRegistry } from '../models';

// The definer emits '' for an unset hook; the store builder wants undefined.
const toCollection = (collection: EventDocTransferCollection): EventDocTransferCollection => ({
  storeName: collection.storeName,
  type: collection.type,
  onPublish: collection.onPublish || undefined,
  onAppend: collection.onAppend || undefined,
});

/** Reads the collection registry from the transfer routes' globals. */
export function* askEventDocTransferReadRegistry(): AskResponse<EventDocTransferRegistry> {
  const service = yield* askConfigGetGlobal<string>(EVENT_DOC_TRANSFER_SERVICE_GLOBAL);
  const collections = yield* askConfigGetGlobal<EventDocTransferCollection[]>(EVENT_DOC_TRANSFER_COLLECTIONS_GLOBAL);

  return { service, collections: collections.map(toCollection) };
}
