import { eventDocEventsStoreName } from '../constants/eventDocEventsStoreName';
import { eventDocSnapshotsStoreName } from '../constants/eventDocSnapshotsStoreName';
import { eventDocStorageDriveName } from '../constants/eventDocStorageDriveName';
import { EventDocStore } from '../types/EventDocStore';

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

/** One list whichever way the sync option was written; '' and [] both mean no pushes. */
export const toSyncWebsocketApiNames = (syncWebsocketApiName: unknown): string[] => {
  if (Array.isArray(syncWebsocketApiName)) {
    return syncWebsocketApiName.filter((name): name is string => typeof name === 'string' && name !== '');
  }

  return typeof syncWebsocketApiName === 'string' && syncWebsocketApiName !== '' ? [syncWebsocketApiName] : [];
};

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
