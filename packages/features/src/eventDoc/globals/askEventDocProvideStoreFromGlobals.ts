import { askCatch, askConfigGetGlobal, AskResponse } from '@qpqjs/core';

import {
  EVENT_DOC_AUTHORISER_GLOBAL,
  EVENT_DOC_EVENTS_STORE_NAME_GLOBAL,
  EVENT_DOC_ON_APPEND_GLOBAL,
  EVENT_DOC_ON_PUBLISH_GLOBAL,
  EVENT_DOC_SCOPE_RESOLVER_GLOBAL,
  EVENT_DOC_STORAGE_DRIVE_GLOBAL,
  EVENT_DOC_STORE_NAME_GLOBAL,
  EVENT_DOC_SYNC_WEBSOCKET_API_GLOBAL,
  EVENT_DOC_TYPE_GLOBAL,
} from '../constants/eventDocGlobalNames';
import { eventDocSnapshotsStoreName } from '../constants/eventDocSnapshotsStoreName';
import { askEventDocStoreProvide } from '../context/askEventDocStoreProvide';
import { toSyncWebsocketApiNames } from '../context/buildEventDocStore';

// A missing optional hook global must read as "not configured" ('') rather than throw; routes registered before the
// key existed have no global at all.
function* askConfigGetGlobalAddedAfterV1(globalName: string): AskResponse<string> {
  const result = yield* askCatch(askConfigGetGlobal<string>(globalName));
  return (result.success && result.result) || '';
}

// Stored as a list, but routes registered when it was a single name hold a string (or '' for none).
function* askConfigGetSyncWebsocketApiNames(): AskResponse<string[]> {
  const result = yield* askCatch(askConfigGetGlobal<unknown>(EVENT_DOC_SYNC_WEBSOCKET_API_GLOBAL));
  return toSyncWebsocketApiNames(result.success ? result.result : []);
}

/** Builds the store context from the per-route globals set by buildEventDocStoreGlobals; throws if a required one is missing. */
export function* askEventDocProvideStoreFromGlobals<T>(story: AskResponse<T>): AskResponse<T> {
  const storeName = yield* askConfigGetGlobal<string>(EVENT_DOC_STORE_NAME_GLOBAL);
  const eventsStoreName = yield* askConfigGetGlobal<string>(EVENT_DOC_EVENTS_STORE_NAME_GLOBAL);
  const type = yield* askConfigGetGlobal<string>(EVENT_DOC_TYPE_GLOBAL);
  const storageDriveName = yield* askConfigGetGlobal<string>(EVENT_DOC_STORAGE_DRIVE_GLOBAL);
  const onPublish = yield* askConfigGetGlobalAddedAfterV1(EVENT_DOC_ON_PUBLISH_GLOBAL);
  const onAppend = yield* askConfigGetGlobalAddedAfterV1(EVENT_DOC_ON_APPEND_GLOBAL);
  const scopeResolver = yield* askConfigGetGlobalAddedAfterV1(EVENT_DOC_SCOPE_RESOLVER_GLOBAL);
  const authorise = yield* askConfigGetGlobalAddedAfterV1(EVENT_DOC_AUTHORISER_GLOBAL);
  const syncWebsocketApiNames = yield* askConfigGetSyncWebsocketApiNames();

  return yield* askEventDocStoreProvide(
    {
      storeName,
      eventsStoreName,
      // Derived rather than read from a global so routes registered before snapshots existed still resolve it.
      snapshotsStoreName: eventDocSnapshotsStoreName(storeName),
      type,
      storageDriveName,
      onPublish,
      onAppend,
      scopeResolver,
      authorise,
      syncWebsocketApiNames,
    },
    story,
  );
}
