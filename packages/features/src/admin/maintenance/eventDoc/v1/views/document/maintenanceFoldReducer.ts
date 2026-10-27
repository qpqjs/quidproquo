import { buildEventDocFoldReducer } from '../../../../../../eventDoc/fold/buildEventDocFoldReducer';
import { EventDocFoldEffects } from '../../../../../../eventDoc/fold/EventDocFoldEffects';
import { MaintenanceEffect } from '../../events/effects/MaintenanceEffect';
import { MaintenanceEffects } from '../../events/effects/MaintenanceEffects';
import { addUpdate } from './stateUpdaters/addUpdate';
import { editUpdate } from './stateUpdaters/editUpdate';
import { removeUpdate } from './stateUpdaters/removeUpdate';
import { createInitialMaintenanceState, MaintenanceState } from './MaintenanceState';

export const maintenanceFoldReducer = buildEventDocFoldReducer<MaintenanceState, EventDocFoldEffects<MaintenanceEffects>>(
  createInitialMaintenanceState,
  {
    [MaintenanceEffect.AddUpdate]: addUpdate,
    [MaintenanceEffect.EditUpdate]: editUpdate,
    [MaintenanceEffect.RemoveUpdate]: removeUpdate,
  },
);
