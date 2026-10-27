import { createEventDocDefinition } from '../../../eventDoc/definition/createEventDocDefinition';
import { MAINTENANCE_SCHEMA_VERSION } from '../constants/maintenanceConstants';
import { askMaintenanceAddUpdate } from './v1/events/actionCreators/askMaintenanceAddUpdate';
import { askMaintenanceEditUpdate } from './v1/events/actionCreators/askMaintenanceEditUpdate';
import { askMaintenanceRemoveUpdate } from './v1/events/actionCreators/askMaintenanceRemoveUpdate';
import { maintenanceV1 } from './v1/maintenanceV1';

// THE maintenance event doc: its version history + the doc's own verbs. Folds anywhere
// via `maintenanceEventDoc.views.document.fold(events)` — the admin editor, the broadcast
// hook, the sync-on-connect service function. The UPDATE is the only mutation (a full
// status snapshot; the current state derives from the update list). Draft =
// active maintenance, published = closed; reopening branches a new draft (the
// generic lifecycle verbs merge in).
//
// `versions` is the doc type's whole history, oldest first — each entry a frozen bundle
// owning its own folder. `schemaVersion` is the LATEST, stamped on newly authored events;
// it is asserted equal to the newest entry, so a version folder that was written but never
// listed here is a crash rather than a silently inert one.
//
// The api verbs are NOT versioned: you only ever write at the latest version, so a v1
// creator would be dead the moment v2 landed. What v1 must keep forever is the shape of
// the events it wrote and the reducer that folds them — which is exactly what its folder
// holds.
export const maintenanceEventDoc = createEventDocDefinition({
  schemaVersion: MAINTENANCE_SCHEMA_VERSION,
  versions: [maintenanceV1],
  api: {
    askMaintenanceAddUpdate,
    askMaintenanceEditUpdate,
    askMaintenanceRemoveUpdate,
  },
});
