import { AskResponse } from 'quidproquo-core';
import { ExecuteServiceFunctionEvent } from 'quidproquo-webserver';

import { askEventDocProvideStore } from '../../../../eventDoc/context/askEventDocProvideStore';
import { maintenanceStoreOptions } from '../../config/maintenanceStoreOptions';
import { MaintenancePublicState } from '../../eventDoc/MaintenancePublicState';
import { askGetActiveMaintenancePublicStates } from '../../logic/askGetActiveMaintenancePublicStates';

// Admin-owned service function: the cross-service read of the active maintenance
// public folds (the websocket lambda's connect-time sync calls this — it has
// no access to the admin-only maintenance stores).
export function* qpqGetActiveMaintenances(_event: ExecuteServiceFunctionEvent<undefined>): AskResponse<MaintenancePublicState[]> {
  return yield* askEventDocProvideStore(maintenanceStoreOptions, askGetActiveMaintenancePublicStates());
}
