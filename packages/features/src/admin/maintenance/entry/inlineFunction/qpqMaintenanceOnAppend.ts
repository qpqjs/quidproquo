import { askCatch, AskResponse } from 'quidproquo-core';

import { EventDocOnAppendInput } from '../../../../eventDoc/models/EventDocOnAppendInput';
import { isMaintenancePubliclyVisible } from '../../eventDoc/isMaintenancePubliclyVisible';
import { MaintenanceState } from '../../eventDoc/v1/views/document/MaintenanceState';
import { askBroadcastMaintenancePublicStates } from '../../logic/askBroadcastMaintenancePublicStates';
import { askGetActiveMaintenancePublicStates } from '../../logic/askGetActiveMaintenancePublicStates';

// Fired after EVERY maintenance append (the collection's onAppend hook), inside
// the append's store context. An Internal maintenance must be COMPLETELY silent
// on the wire, so we only broadcast when this doc was or becomes publicly
// visible (the append hands the folded state before and after the event) — that
// covers both transitions: promoting Internal→Info/Low/High announces it, and
// demoting to Internal (or closing) pushes the remaining set, clearing it from
// screens. The broadcast is best-effort — the event has landed, and a failed
// push self-heals on the next visible append or on each connection's
// connect-time sync — so a websocket hiccup must not fail the admin's save.
export function* qpqMaintenanceOnAppend(input: EventDocOnAppendInput): AskResponse<void> {
  const visibleAfter = isMaintenancePubliclyVisible(input.state as MaintenanceState);
  const visibleBefore = isMaintenancePubliclyVisible(input.previousState as MaintenanceState);

  if (!visibleBefore && !visibleAfter) {
    return;
  }

  const maintenances = yield* askGetActiveMaintenancePublicStates();

  yield* askCatch(askBroadcastMaintenancePublicStates(maintenances));
}
