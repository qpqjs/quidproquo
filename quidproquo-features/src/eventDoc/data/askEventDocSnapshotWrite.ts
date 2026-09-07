import { askFileWriteTextContents, askKeyValueStoreUpsert, AskResponse } from 'quidproquo-core';

import { EVENT_DOC_SNAPSHOT_INLINE_MAX_BYTES } from '../constants/eventDocSnapshotInlineLimits';
import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { serializeEventDocValue } from '../logic/serializeEventDocValue';
import { EventDocSnapshot } from '../models';
import { eventDocSnapshotPk, EventDocStoredSnapshot } from '../types/EventDocStoredSnapshot';
import { askEventDocResolveScope } from './askEventDocResolveScope';
import { eventDocSnapshotPath } from './eventDocSnapshotPath';

// Store ONE view's folded state at one event: inline on the snapshot row when it is
// small, offloaded to the collection's blob drive when it is not (a folded state has no
// size bound; a KVS row does). The blob lands FIRST so an offloaded row never points at
// bytes that are not there yet, and its path is derived from the row's own keys, so
// nothing is stored twice. Writes are unconditional upserts: snapshots are pure
// derivations of the log, so a replay (the stream's at-least-once delivery) rewrites the
// identical fact, and last-write-wins is exactly right.
//
// `views` is the manifest stamped on the document row (see EventDocSnapshot) — callers
// write a whole per-view set via askEventDocSnapshotViewsWrite, which owns the ordering
// that makes the manifest-carrying row the set's commit marker.
export function* askEventDocSnapshotWrite(docId: string, viewName: string, eventId: number, state: unknown, views?: string[]): AskResponse<void> {
  const { snapshotsStoreName, storageDriveName, type } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();

  const { json, bytes } = serializeEventDocValue(state);
  const inline = bytes <= EVENT_DOC_SNAPSHOT_INLINE_MAX_BYTES;

  if (!inline) {
    yield* askFileWriteTextContents(storageDriveName, eventDocSnapshotPath(docId, viewName, eventId), json, undefined, scope);
  }

  // The manifest key is omitted (not written undefined) so non-document rows stay free of it.
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
