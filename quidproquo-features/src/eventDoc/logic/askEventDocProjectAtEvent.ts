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
 * Project a document as of one event: fold every view from the newest snapshot seed through the gap, then write
 * the summary row and the snapshot set. Falls back to a whole-prefix fold with no usable seed, and to
 * askEventDocSummaryRederive when the fold produces nothing. Event reads are consistent: a snapshot missing the
 * event it claims to capture is never rewritten.
 */
export function* askEventDocProjectAtEvent(modelId: string, eventId: number, functionsName: string): AskResponse<void> {
  const functionsCaller = createDynamicFunctionCaller<EventDocInvokableFunctions>(functionsName);
  const seed = yield* askEventDocSnapshotSeedLatest(modelId, eventId);

  if (seed?.eventId === eventId) {
    const seedSummary = seed.views[EVENT_DOC_SUMMARY_VIEW];

    // An earlier delivery may have died between the summary write and the snapshot write; rewrite the summary from the seed.
    if (seedSummary !== undefined) {
      yield* askEventDocSummaryViewWrite(modelId, seedSummary as EventDocSummaryView);
      return;
    }

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

  // No views means an emptied log or a broken registration; never store a snapshot of an absent document.
  if (!snapshotViews) {
    yield* askEventDocSummaryRederive(modelId);
    return;
  }

  const summaryView = snapshotViews[EVENT_DOC_SUMMARY_VIEW];

  // Summary first, then snapshots: a crash in between leaves the seed behind the event, so a replay redoes both.
  if (summaryView !== undefined) {
    yield* askEventDocSummaryViewWrite(modelId, summaryView as EventDocSummaryView);
  } else {
    yield* askEventDocSummaryRederive(modelId);
  }

  yield* askEventDocSnapshotViewsWrite(modelId, eventId, snapshotViews);
}
