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
};

/** Builds an EventDocStore from storeName + type. Single source of the naming convention shared by built-in and custom routes. */
export const buildEventDocStore = ({ storeName, type, onPublish, onAppend, scopeResolver, authorise }: EventDocStoreOptions): EventDocStore => ({
  storeName,
  eventsStoreName: eventDocEventsStoreName(storeName),
  snapshotsStoreName: eventDocSnapshotsStoreName(storeName),
  type,
  storageDriveName: eventDocStorageDriveName(storeName),
  onPublish,
  onAppend,
  scopeResolver,
  authorise,
});
