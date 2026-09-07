import { askKeyValueStoreQuery, AskResponse, kvsAnd, kvsEqual, kvsLessThanOrEqual, Nullable } from 'quidproquo-core';

import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EVENT_DOC_PRIMARY_VIEW } from '../definition/types/EventDocLatestViews';
import { EventDocSnapshotBase } from '../models';
import { eventDocSnapshotPk, EventDocStoredSnapshot } from '../types/EventDocStoredSnapshot';
import { askEventDocResolveScope } from './askEventDocResolveScope';
import { askEventDocSnapshotStateResolve } from './askEventDocSnapshotStateResolve';

/**
 * Load the newest DOCUMENT-view snapshot at or before `upToEventId` as a reader's fold
 * base, or null when there is nothing usable and the reader should fold from scratch.
 *
 * The sibling of askEventDocSnapshotSeedLatest with the reader's (not the projector's)
 * requirements: a reader folds only the document view, so the sibling views and the
 * manifest check are irrelevant here — the document row's own state is complete the
 * moment the row exists, whether or not the rest of its set landed.
 *
 * `upToEventId` should be the log's current head: snapshot rows are not deleted with
 * their events (a transfer overwrite rewrites the log but leaves the snapshot store), so an
 * unclamped read could serve a snapshot newer than every event that now exists. Clamping
 * to the head bounds that failure to snapshots that collide with the new log's id range —
 * removing it entirely is the snapshot-cleanup follow-up, not this read's job.
 *
 * Reads are eventually consistent on purpose: the base is an optimisation, not a
 * correctness input — a stale replica surfaces an older base and the reader folds a
 * longer tail for the same answer.
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
