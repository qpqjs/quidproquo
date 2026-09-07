import { AskResponse, createDynamicFunctionCaller, Nullable } from 'quidproquo-core';

import { askEventDocEventListAll } from '../data/askEventDocEventListAll';
import { askEventDocSnapshotSeedLatest } from '../data/askEventDocSnapshotSeedLatest';
import { askEventDocSnapshotViewsWrite } from '../data/askEventDocSnapshotViewsWrite';
import { askEventDocSummaryViewWrite } from '../data/askEventDocSummaryViewWrite';
import { EventDocInvokableFunctions } from '../definition/types/EventDocInvokableFunctions';
import { EVENT_DOC_SUMMARY_VIEW } from '../definition/types/EventDocLatestViews';
import { EventDocSnapshotViews, EventDocSummaryView } from '../models';
import { askEventDocSummaryRederive } from './askEventDocSummaryRederive';

/**
 * Project a document as of ONE event: fold every view of the log up to (and including)
 * that event ONCE, then persist the summary row from the fold's `summary` view and the
 * per-view snapshot set. One incremental fold drives both projections — the summary is
 * no longer a separate whole-log re-derivation per stream delivery.
 *
 * INCREMENTAL by default: the newest complete snapshot at or before the event seeds the
 * fold, and only the gap since it is read and folded — so the work per stream delivery
 * tracks the size of the burst, not the length of the log. The equivalence to a
 * from-scratch fold is owned by the fold layer (state-based acceptance + era-pinned
 * seeds, see foldSnapshotViews); this function only finds the seed and the gap. With no
 * usable seed — no snapshot yet, a pre-manifest snapshot, a partial set, or a fold that
 * declines the seed (a view added since it was written) — it falls back to folding the
 * whole prefix, whose write then restores a complete seed for next time.
 *
 * Anything the fold CANNOT produce (a broken registration, a log emptied out from under
 * the stream) degrades to askEventDocSummaryRederive so the summary row is still
 * maintained exactly as it always was — snapshots are the optimisation, the summary is
 * the contract.
 *
 * Write order is summary FIRST, then snapshots. A crash between the two leaves the seed
 * older than the event, so the replayed delivery refolds and rewrites both. The inverse
 * order would let a replay find the snapshot set complete and skip the summary forever —
 * which is also why a seed already AT the event still rewrites the summary row from the
 * seed's own summary view (cheap, idempotent) instead of returning outright.
 *
 * Event reads are CONSISTENT: the caller is the event store's stream handler, so the
 * event being projected was durably written moments ago, and an eventually-consistent
 * query can still miss it — which would store a snapshot at eventId that silently lacks
 * the event it claims to capture, permanently (nothing later rewrites an old eventId).
 * The seed read stays eventually consistent — a stale seed only means folding a longer
 * gap for the same answer.
 */
export function* askEventDocProjectAtEvent(modelId: string, eventId: number, functionsName: string): AskResponse<void> {
  const functionsCaller = createDynamicFunctionCaller<EventDocInvokableFunctions>(functionsName);
  const seed = yield* askEventDocSnapshotSeedLatest(modelId, eventId);

  if (seed?.eventId === eventId) {
    const seedSummary = seed.views[EVENT_DOC_SUMMARY_VIEW];

    // The snapshot set is fully written (the document row is the set's last write), but
    // an earlier delivery may have died between the summary write and here — re-cover
    // the summary from the seed rather than trusting it landed.
    if (seedSummary !== undefined) {
      yield* askEventDocSummaryViewWrite(modelId, seedSummary as EventDocSummaryView);
      return;
    }

    // A snapshot set without a summary view predates the summary riding the fold.
    yield* askEventDocSummaryRederive(modelId);
    return;
  }

  let snapshotViews: Nullable<EventDocSnapshotViews> = null;

  if (seed) {
    const gap = yield* askEventDocEventListAll(modelId, { afterEventId: seed.eventId, upToEventId: eventId, consistentRead: true });

    if (gap.length > 0) {
      snapshotViews = yield* functionsCaller.foldSnapshotViews(gap, seed.views);
    }
  }

  if (!snapshotViews) {
    const events = yield* askEventDocEventListAll(modelId, { upToEventId: eventId, consistentRead: true });

    if (events.length > 0) {
      snapshotViews = yield* functionsCaller.foldSnapshotViews(events);
    }
  }

  // No views: an empty prefix folds to nothing worth storing — it can only mean the
  // log's rows were deleted out from under the stream (a transfer/cleanup) — and a
  // fold given no seed has nothing to decline, so null is a broken registration. A
  // snapshot of an absent document would just be a pristine seed masquerading as a
  // fact; the summary still gets maintained the old way.
  if (!snapshotViews) {
    yield* askEventDocSummaryRederive(modelId);
    return;
  }

  const summaryView = snapshotViews[EVENT_DOC_SUMMARY_VIEW];

  // A fold without a summary view (shouldn't happen through createEventDocDefinition,
  // which always folds one) only degrades the SUMMARY derivation — snapshots still
  // write below.
  if (summaryView !== undefined) {
    yield* askEventDocSummaryViewWrite(modelId, summaryView as EventDocSummaryView);
  } else {
    yield* askEventDocSummaryRederive(modelId);
  }

  yield* askEventDocSnapshotViewsWrite(modelId, eventId, snapshotViews);
}
