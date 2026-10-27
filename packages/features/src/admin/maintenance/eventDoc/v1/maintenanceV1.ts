import { QpqReducer } from 'quidproquo-core';

import { EventDocBaseVersion } from '../../../../eventDoc/definition/types/EventDocVersion';
import { EventDocEvent } from '../../../../eventDoc/models/EventDocEvent';
import { MAINTENANCE_VERSION } from './constants/maintenanceVersion';
import { maintenanceFoldReducer } from './views/document/maintenanceFoldReducer';
import { createInitialMaintenanceState, MaintenanceState } from './views/document/MaintenanceState';

// Version 1 of the maintenance doc type, as one self-contained bundle: what its events
// look like (./events), how each view folds them (./views), and — for a base version —
// where each view starts.
//
// FROZEN. Once v2 exists this folder is never edited again: `cp -r v1 v2`, change what v2
// changes, and leave v1 exactly as it was. A log written in 2026 must still fold in 2036
// the way it did the day it was written, and the only reliable way to guarantee that is
// for the code that folds it to be somewhere nobody has a reason to touch.
//
// A later version's bundle looks the same minus `createInitialViewState` and plus
// `migrateFromPrevious` — only the base can seed, because every log opens with an
// INIT_STATE stamped version 1 and climbs from there.
export const maintenanceV1: EventDocBaseVersion<{ document: MaintenanceState }> = {
  version: MAINTENANCE_VERSION,
  views: {
    document: {
      // Typed to its own effect union; speaks the generic EventDocEvent at the
      // registration boundary (same convention as every doc type).
      foldReducer: maintenanceFoldReducer as QpqReducer<MaintenanceState, EventDocEvent>,
      createInitialViewState: createInitialMaintenanceState,
    },
  },
};
