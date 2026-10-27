import { Effect } from 'quidproquo-core';

import { MaintenanceEffect } from './MaintenanceEffect';
import { MaintenanceUpdateData } from './MaintenanceUpdateData';

export type MaintenanceEditUpdateEffect = Effect<MaintenanceEffect.EditUpdate, MaintenanceUpdateData>;
