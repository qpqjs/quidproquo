import { AskResponse, createDynamicFunctionCaller, Nullable } from 'quidproquo-core';

import { askEventDocEventListAll } from '../data/askEventDocEventListAll';
import { askEventDocSnapshotSeedLatest } from '../data/askEventDocSnapshotSeedLatest';
import { askEventDocSnapshotViewsWrite } from '../data/askEventDocSnapshotViewsWrite';
import { askEventDocSummaryViewWrite } from '../data/askEventDocSummaryViewWrite';
import { EventDocInvokableFunctions } from '../definition/types/EventDocInvokableFunctions';
import { EVENT_DOC_SUMMARY_VIEW } from '../definition/types/EventDocLatestViews';
import { EventDocSnapshotViews, EventDocSummaryView, eventDocSummaryViewSchema } from '../models';
import { askEventDocSnapshotCacheKeyResolve } from './askEventDocSnapshotCacheKeyResolve';
import { askEventDocSummaryRederive } from './askEventDocSummaryRederive';

/**
 * Project a document as of one event: fold every view from the newest snapshot seed through the gap, then write
 * the summary row and the snapshot set, all under the collection's snapshot cache key (a seed under another key is
 * invisible, so a changed key refolds the whole prefix). Falls back to a whole-prefix fold with no usable seed, and to
 * askEventDocSummaryRederive when the fold produces nothing or a summary view that does not parse (a snapshot from
 * before the view carried `eventId` included). Event reads are consistent: a snapshot missing the event it claims to
 * capture is never rewritten. Returns the summary view as projected (null for an emptied log).
 *
 * The summary write is guarded on the view's `eventId`, so a projection that lands after a newer one leaves the row
 * alone. The snapshots are written regardless: they are per-event rows, and readers take the newest at or before their
 * target.
 */
export function* askEventDocProjectAtEvent(modelId: string, eventId: number, functionsName: string): AskResponse<Nullable<EventDocSummaryView>> {
  const functionsCaller = createDynamicFunctionCaller<EventDocInvokableFunctions>(functionsName);
  const snapshotCacheKey = yield* askEventDocSnapshotCacheKeyResolve(functionsName);
  const seed = yield* askEventDocSnapshotSeedLatest(modelId, eventId, snapshotCacheKey);

  if (seed?.eventId === eventId) {
    const seedSummary = eventDocSummaryViewSchema.safeParse(seed.views[EVENT_DOC_SUMMARY_VIEW]);

    // An earlier delivery may have died between the summary write and the snapshot write; rewrite the summary from the seed.
    if (seedSummary.success) {
      yield* askEventDocSummaryViewWrite(modelId, seedSummary.data);
      return seedSummary.data;
    }

    return yield* askEventDocSummaryRederive(modelId);
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

  // No views means an emptied log or a broken registration; never store a snapshot of an absent document.
  if (!snapshotViews) {
    return yield* askEventDocSummaryRederive(modelId);
  }

  const summaryView = eventDocSummaryViewSchema.safeParse(snapshotViews[EVENT_DOC_SUMMARY_VIEW]);

  // Summary first, then snapshots: a crash in between leaves the seed behind the event, so a replay redoes both.
  let projected: Nullable<EventDocSummaryView>;
  if (summaryView.success) {
    projected = summaryView.data;
    yield* askEventDocSummaryViewWrite(modelId, projected);
  } else {
    projected = yield* askEventDocSummaryRederive(modelId);
  }

  yield* askEventDocSnapshotViewsWrite(modelId, eventId, snapshotViews, snapshotCacheKey);

  return projected;
}
