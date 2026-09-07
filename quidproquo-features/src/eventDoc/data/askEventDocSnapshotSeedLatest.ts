import { askKeyValueStoreQuery, AskResponse, kvsAnd, kvsEqual, kvsLessThanOrEqual, Nullable } from 'quidproquo-core';

import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EVENT_DOC_PRIMARY_VIEW } from '../definition/types/EventDocLatestViews';
import { EventDocSnapshotSeed, EventDocSnapshotViews } from '../models';
import { eventDocSnapshotPk, EventDocStoredSnapshot } from '../types/EventDocStoredSnapshot';
import { askEventDocResolveScope } from './askEventDocResolveScope';
import { askEventDocSnapshotStateResolve } from './askEventDocSnapshotStateResolve';

/**
 * Newest complete per-view snapshot set at or before `upToEventId` for the projector to resume from, or null.
 * Anchors on the document row, which is written last with the manifest of sibling views; any missing sibling row or
 * blob makes the whole seed null rather than folding that view from nothing.
 */
export function* askEventDocSnapshotSeedLatest(docId: string, upToEventId: number): AskResponse<Nullable<EventDocSnapshotSeed>> {
  const { snapshotsStoreName } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();

  const documentPage = yield* askKeyValueStoreQuery<EventDocStoredSnapshot>(
    snapshotsStoreName,
    kvsAnd([kvsEqual('pk', eventDocSnapshotPk(docId, EVENT_DOC_PRIMARY_VIEW)), kvsLessThanOrEqual('sk', upToEventId)]),
    { sortAscending: false, limit: 1, scope },
  );

  const documentRow = documentPage.items[0];

  if (!documentRow?.data.views) {
    return null;
  }

  const views: EventDocSnapshotViews = {};

  for (const viewName of documentRow.data.views) {
    const row =
      viewName === EVENT_DOC_PRIMARY_VIEW
        ? documentRow
        : (yield* askKeyValueStoreQuery<EventDocStoredSnapshot>(
            snapshotsStoreName,
            kvsAnd([kvsEqual('pk', eventDocSnapshotPk(docId, viewName)), kvsEqual('sk', documentRow.sk)]),
            { limit: 1, scope },
          )).items[0];

    if (!row) {
      return null;
    }

    const resolved = yield* askEventDocSnapshotStateResolve(docId, viewName, row);

    if (!resolved) {
      return null;
    }

    views[viewName] = resolved.state;
  }

  return { eventId: documentRow.sk, views };
}
