import { createLocalContextIdentifier } from 'quidproquo-core';

import { EventDocStore } from '../types/EventDocStore';

/** Local context (never serialized across a service boundary) for the store binding. The empty default means "not provided". */
export const eventDocStoreContext = createLocalContextIdentifier<EventDocStore>('exengne-event-doc-store', {
  storeName: '',
  eventsStoreName: '',
  snapshotsStoreName: '',
  type: '',
  storageDriveName: '',
});
