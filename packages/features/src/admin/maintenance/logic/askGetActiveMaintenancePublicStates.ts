import { AskResponse } from 'quidproquo-core';

import { askEventDocList } from '../../../eventDoc/data/askEventDocList';
import { askEventDocDocumentStateLatest } from '../../../eventDoc/logic/askEventDocDocumentStateLatest';
import { toEventDocListItem } from '../../../eventDoc/models/toEventDocListItem';
import { isMaintenancePubliclyVisible } from '../eventDoc/isMaintenancePubliclyVisible';
import { toMaintenancePublicState } from '../eventDoc/logic/toMaintenancePublicState';
import { MaintenancePublicState } from '../eventDoc/MaintenancePublicState';
import { MaintenanceState } from '../eventDoc/v1/views/document/MaintenanceState';

// Fold every publicly visible maintenance (open draft, has updates, not
// Internal — see isMaintenancePubliclyVisible) to its public projection, newest
// first. Requires the maintenance store context (route globals or
// askEventDocProvideStore). The summary's open-draft flag pre-filters so only
// active docs pay the state read — which is snapshot-seeded (the registered
// definition's foldDocumentState), so an active doc costs its burst since the
// last snapshot, not its log.
export function* askGetActiveMaintenancePublicStates(): AskResponse<MaintenancePublicState[]> {
  const summaries = yield* askEventDocList();

  const activeSummaries = summaries.filter((summary) => toEventDocListItem(summary).hasDraft);

  const states: MaintenancePublicState[] = [];

  for (const summary of activeSummaries) {
    const stateAtHead = yield* askEventDocDocumentStateLatest(summary.id);
    const state = stateAtHead?.state as MaintenanceState | undefined;

    if (state && isMaintenancePubliclyVisible(state)) {
      states.push(toMaintenancePublicState(state));
    }
  }

  return states.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
