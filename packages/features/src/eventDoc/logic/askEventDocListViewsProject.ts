import { askMap, AskResponse } from '@qpqjs/core';

import { askEventDocListViewWrite } from '../data/askEventDocListViewWrite';
import { EventDocListViewState, EventDocSnapshotViews } from '../models';

/**
 * Write every list view's row from one projection of a document at `eventId`. Authoritative: the projector folded
 * these under the acceptance rules, so they replace a row the append path left at the same event. A view the
 * projection does not hold is skipped.
 */
export function* askEventDocListViewsProject(modelId: string, eventId: number, views: EventDocSnapshotViews, viewNames: string[]): AskResponse<void> {
  yield* askMap(viewNames, function* askProjectOne(viewName: string) {
    const state = views[viewName];

    if (state !== undefined && state !== null) {
      // The collection's own fold produced this state, so the cast restates provenance.
      yield* askEventDocListViewWrite(modelId, viewName, eventId, state as EventDocListViewState, { authoritative: true });
    }
  });
}
