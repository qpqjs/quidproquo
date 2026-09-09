import { askKeyValueStoreQuery, AskResponse, kvsAnd, kvsEqual, kvsLessThanOrEqual, Nullable } from 'quidproquo-core';

import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EVENT_DOC_PRIMARY_VIEW } from '../definition/types/EventDocLatestViews';
import { EventDocSnapshotBase } from '../models';
import { eventDocSnapshotPk, EventDocStoredSnapshot } from '../types/EventDocStoredSnapshot';
import { askEventDocResolveScope } from './askEventDocResolveScope';
import { askEventDocSnapshotStateResolve } from './askEventDocSnapshotStateResolve';

/**
 * Newest document-view snapshot at or before `upToEventId` as a reader's fold base, or null to fold from scratch.
 * Pass the log head as `upToEventId`: snapshot rows outlive their events after a transfer overwrite. Eventually consistent
 * on purpose, a stale base only means a longer tail fold.
 */
export function* askEventDocSnapshotBaseLatest(docId: string, upToEventId: number): AskResponse<Nullable<EventDocSnapshotBase>> {
  const { snapshotsStoreName } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();

  const documentPage = yield* askKeyValueStoreQuery<EventDocStoredSnapshot>(
    snapshotsStoreName,
    kvsAnd([kvsEqual('pk', eventDocSnapshotPk(docId, EVENT_DOC_PRIMARY_VIEW)), kvsLessThanOrEqual('sk', upToEventId)]),
    { sortAscending: false, limit: 1, scope },
  );

  const documentRow = documentPage.items[0];

  if (!documentRow) {
    return null;
  }

  const resolved = yield* askEventDocSnapshotStateResolve(docId, EVENT_DOC_PRIMARY_VIEW, documentRow);

  if (!resolved) {
    return null;
  }

  return { eventId: documentRow.sk, state: resolved.state };
}
