import { AskResponse, createDynamicFunctionCaller, Nullable } from '@qpqjs/core';

import { askEventDocEventListAll } from '../data/askEventDocEventListAll';
import { askEventDocSnapshotSeedLatest } from '../data/askEventDocSnapshotSeedLatest';
import { askEventDocSnapshotViewsWrite } from '../data/askEventDocSnapshotViewsWrite';
import { EventDocInvokableFunctions } from '../definition/types/EventDocInvokableFunctions';
import { EVENT_DOC_SUMMARY_VIEW } from '../definition/types/EventDocLatestViews';
import { EventDocDocument, EventDocSnapshotSeed, EventDocSnapshotViews, EventDocSummaryView } from '../models';
import { askEventDocListViewNamesResolve } from './askEventDocListViewNamesResolve';
import { askEventDocListViewsProject } from './askEventDocListViewsProject';
import { askEventDocSnapshotCacheKeyResolve } from './askEventDocSnapshotCacheKeyResolve';
import { askEventDocSummaryRederive } from './askEventDocSummaryRederive';

// A seed is only a starting point when every view in it is a folded view state. One written before the summary was an
// ordinary view holds a summary with no schema version, and resuming from that would fold it wrong.
const isSeedUsable = (seed: EventDocSnapshotSeed): boolean =>
  Object.values(seed.views).every((state) => typeof (state as Nullable<EventDocDocument>)?.schemaVersion === 'number');

/**
 * Project a document as of one event: fold every view from the newest snapshot seed through the gap, then write
 * every list view row and the snapshot set, all under the collection's snapshot cache key (a seed under another key is
 * invisible, so a changed key refolds the whole prefix). Falls back to a whole-prefix fold with no usable seed, and to
 * askEventDocSummaryRederive when the fold produces nothing. Event reads are
 * consistent: a snapshot missing the event it claims to capture is never rewritten. Returns the summary view as
 * projected (null for an emptied log).
 *
 * The row writes are guarded on `eventId`, so a projection that lands after a newer one leaves the rows alone, while
 * one at the same event replaces what the append path wrote. The snapshots are written regardless: they are per-event
 * rows, and readers take the newest at or before their target.
 */
export function* askEventDocProjectAtEvent(modelId: string, eventId: number, functionsName: string): AskResponse<Nullable<EventDocSummaryView>> {
  const functionsCaller = createDynamicFunctionCaller<EventDocInvokableFunctions>(functionsName);
  const snapshotCacheKey = yield* askEventDocSnapshotCacheKeyResolve(functionsName);
  const viewNames = yield* askEventDocListViewNamesResolve(functionsName);
  const latestSeed = yield* askEventDocSnapshotSeedLatest(modelId, eventId, snapshotCacheKey);
  const seed = latestSeed && isSeedUsable(latestSeed) ? latestSeed : null;

  // An earlier delivery may have died between the row writes and the snapshot write; rewrite the rows from the seed.
  if (seed?.eventId === eventId) {
    yield* askEventDocListViewsProject(modelId, eventId, seed.views, viewNames);

    return seed.views[EVENT_DOC_SUMMARY_VIEW] as EventDocSummaryView;
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

  // Rows first, then snapshots: a crash in between leaves the seed behind the event, so a replay redoes both.
  yield* askEventDocListViewsProject(modelId, eventId, snapshotViews, viewNames);

  yield* askEventDocSnapshotViewsWrite(modelId, eventId, snapshotViews, snapshotCacheKey);

  // The collection's own fold produced this state, so the cast restates provenance.
  return (snapshotViews[EVENT_DOC_SUMMARY_VIEW] as Nullable<EventDocSummaryView>) ?? null;
}
