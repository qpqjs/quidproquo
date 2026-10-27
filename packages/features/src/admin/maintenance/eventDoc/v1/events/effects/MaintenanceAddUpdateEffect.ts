import { Effect } from 'quidproquo-core';

import { MaintenanceEffect } from './MaintenanceEffect';
import { MaintenanceUpdateData } from './MaintenanceUpdateData';

export type MaintenanceAddUpdateEffect = Effect<MaintenanceEffect.AddUpdate, MaintenanceUpdateData>;
