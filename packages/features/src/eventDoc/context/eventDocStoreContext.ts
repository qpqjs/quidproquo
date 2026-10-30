import { createLocalContextIdentifier } from '@qpqjs/core';

import { EventDocStore } from '../types/EventDocStore';

/** Local context (never serialized across a service boundary) for the store binding. The empty default means "not provided". */
export const eventDocStoreContext = createLocalContextIdentifier<EventDocStore>('qpq-event-doc-store', {
  storeName: '',
  eventsStoreName: '',
  snapshotsStoreName: '',
  type: '',
  storageDriveName: '',
  syncWebsocketApiNames: [],
});
