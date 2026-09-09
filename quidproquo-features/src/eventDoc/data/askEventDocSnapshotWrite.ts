import { askFileWriteTextContents, askKeyValueStoreUpsert, AskResponse } from 'quidproquo-core';

import { EVENT_DOC_SNAPSHOT_INLINE_MAX_BYTES } from '../constants/eventDocSnapshotInlineLimits';
import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { serializeEventDocValue } from '../logic/serializeEventDocValue';
import { EventDocSnapshot } from '../models';
import { eventDocSnapshotPk, EventDocStoredSnapshot } from '../types/EventDocStoredSnapshot';
import { askEventDocResolveScope } from './askEventDocResolveScope';
import { eventDocSnapshotPath } from './eventDocSnapshotPath';

/**
 * Writes one view's folded state at one event to the `${storeName}Snap` store, inline when small, else on the blob drive.
 * The blob is written before the row so a row never points at missing bytes. Unconditional upsert: a stream replay
 * rewrites the identical fact. `views` is the manifest only the document row carries (see askEventDocSnapshotViewsWrite).
 */
export function* askEventDocSnapshotWrite(docId: string, viewName: string, eventId: number, state: unknown, views?: string[]): AskResponse<void> {
  const { snapshotsStoreName, storageDriveName, type } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();

  const { json, bytes } = serializeEventDocValue(state);
  const inline = bytes <= EVENT_DOC_SNAPSHOT_INLINE_MAX_BYTES;

  if (!inline) {
    yield* askFileWriteTextContents(storageDriveName, eventDocSnapshotPath(docId, viewName, eventId), json, undefined, scope);
  }

  const data: EventDocSnapshot = {
    ...(inline ? { type: 'inline' as const, snapshot: state } : { type: 'storageDrive' as const }),
    ...(views ? { views } : {}),
  };

  yield* askKeyValueStoreUpsert<EventDocStoredSnapshot>(
    snapshotsStoreName,
    { pk: eventDocSnapshotPk(docId, viewName), sk: eventId, type, data },
    { scope },
  );
}
