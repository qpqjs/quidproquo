import { AskResponse } from '@qpqjs/core';
import { ExecuteServiceFunctionEvent } from '@qpqjs/webserver';

import { askEventDocStoreProvide, buildEventDocStore } from '../../../../eventDoc/context';
import { maintenanceStoreOptions } from '../../config/maintenanceStoreOptions';
import { MaintenancePublicState } from '../../eventDoc/types/MaintenancePublicState';
import { askMaintenanceGetActivePublicStates } from '../../logic/askMaintenanceGetActivePublicStates';

// Admin-owned service function: the cross-service read of the active maintenance
// public folds (the websocket lambda's connect-time sync calls this, it has
// no access to the admin-only maintenance stores).
export function* qpqGetActiveMaintenances(_event: ExecuteServiceFunctionEvent<undefined>): AskResponse<MaintenancePublicState[]> {
  return yield* askEventDocStoreProvide(buildEventDocStore(maintenanceStoreOptions), askMaintenanceGetActivePublicStates());
}
