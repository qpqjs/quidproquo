import { AskResponse } from 'quidproquo-core';

import { EVENT_DOC_PRIMARY_VIEW } from '../definition/types/EventDocLatestViews';
import { EventDocSnapshotViews } from '../models';
import { askEventDocSnapshotWrite } from './askEventDocSnapshotWrite';

/**
 * Writes a per-view snapshot set at one event. The document row goes last with the manifest of view names: it is the
 * commit marker askEventDocSnapshotSeedLatest anchors on, so a crash mid-set leaves no visible partial seed.
 */
export function* askEventDocSnapshotViewsWrite(docId: string, eventId: number, snapshotViews: EventDocSnapshotViews): AskResponse<void> {
  const viewNames = Object.keys(snapshotViews);

  for (const viewName of viewNames.filter((name) => name !== EVENT_DOC_PRIMARY_VIEW)) {
    yield* askEventDocSnapshotWrite(docId, viewName, eventId, snapshotViews[viewName]);
  }

  yield* askEventDocSnapshotWrite(docId, EVENT_DOC_PRIMARY_VIEW, eventId, snapshotViews[EVENT_DOC_PRIMARY_VIEW], viewNames);
}
