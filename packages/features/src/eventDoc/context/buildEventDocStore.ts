import { eventDocEventsStoreName } from '../constants/eventDocEventsStoreName';
import { eventDocSnapshotsStoreName } from '../constants/eventDocSnapshotsStoreName';
import { eventDocStorageDriveName } from '../constants/eventDocStorageDriveName';
import { EventDocStore } from '../types/EventDocStore';
import { EventDocStoreOptions } from '../types/EventDocStoreOptions';
import { toSyncWebsocketApiNames } from './toSyncWebsocketApiNames';

/** Builds an EventDocStore from storeName + type. Single source of the naming convention shared by built-in and custom routes. */
export const buildEventDocStore = ({
  storeName,
  type,
  onPublish,
  onAppend,
  scopeResolver,
  authorise,
  syncWebsocketApiName,
}: EventDocStoreOptions): EventDocStore => ({
  storeName,
  eventsStoreName: eventDocEventsStoreName(storeName),
  snapshotsStoreName: eventDocSnapshotsStoreName(storeName),
  type,
  storageDriveName: eventDocStorageDriveName(storeName),
  onPublish,
  onAppend,
  scopeResolver,
  authorise,
  syncWebsocketApiNames: toSyncWebsocketApiNames(syncWebsocketApiName),
});
