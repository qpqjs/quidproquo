import {
  EVENT_DOC_EVENTS_STORE_NAME_GLOBAL,
  EVENT_DOC_ON_APPEND_GLOBAL,
  EVENT_DOC_ON_PUBLISH_GLOBAL,
  EVENT_DOC_SCOPE_RESOLVER_GLOBAL,
  EVENT_DOC_STORAGE_DRIVE_GLOBAL,
  EVENT_DOC_STORE_NAME_GLOBAL,
  EVENT_DOC_TYPE_GLOBAL,
} from '../constants/eventDocGlobalNames';
import { EventDocStore } from '../types/EventDocStore';

/**
 * The per-route globals askEventDocProvideStoreFromGlobals reads back. Every definer that mounts eventDoc-context routes
 * must spread this rather than hand-roll the map, or the bridge throws at request time when a field is missing.
 */
export const buildEventDocStoreGlobals = (store: EventDocStore): Record<string, unknown> => ({
  [EVENT_DOC_STORE_NAME_GLOBAL]: store.storeName,
  [EVENT_DOC_EVENTS_STORE_NAME_GLOBAL]: store.eventsStoreName,
  [EVENT_DOC_TYPE_GLOBAL]: store.type,
  [EVENT_DOC_STORAGE_DRIVE_GLOBAL]: store.storageDriveName,
  [EVENT_DOC_ON_PUBLISH_GLOBAL]: store.onPublish ?? '',
  [EVENT_DOC_ON_APPEND_GLOBAL]: store.onAppend ?? '',
  [EVENT_DOC_SCOPE_RESOLVER_GLOBAL]: store.scopeResolver ?? '',
});
