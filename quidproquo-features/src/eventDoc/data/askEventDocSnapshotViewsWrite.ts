import { AskResponse } from 'quidproquo-core';

import { EVENT_DOC_PRIMARY_VIEW } from '../definition/types/EventDocLatestViews';
import { EventDocSnapshotViews } from '../models';
import { askEventDocSnapshotWrite } from './askEventDocSnapshotWrite';

// Store a whole per-view snapshot set at one event. The DOCUMENT row goes LAST, carrying
// the manifest of every view name in the set — that ordering is what makes it the commit
// marker: a crash mid-set leaves sibling rows without their document row, and the seed
// reader (askEventDocSnapshotSeedLatest), which anchors on the document row, never sees
// the partial set. Rows are idempotent facts, so the retry that follows simply finishes
// the job.
export function* askEventDocSnapshotViewsWrite(docId: string, eventId: number, snapshotViews: EventDocSnapshotViews): AskResponse<void> {
  const viewNames = Object.keys(snapshotViews);

  for (const viewName of viewNames.filter((name) => name !== EVENT_DOC_PRIMARY_VIEW)) {
    yield* askEventDocSnapshotWrite(docId, viewName, eventId, snapshotViews[viewName]);
  }

  yield* askEventDocSnapshotWrite(docId, EVENT_DOC_PRIMARY_VIEW, eventId, snapshotViews[EVENT_DOC_PRIMARY_VIEW], viewNames);
}
