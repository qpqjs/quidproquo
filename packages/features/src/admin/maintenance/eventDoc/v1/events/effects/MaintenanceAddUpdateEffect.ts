import { Effect } from '@qpqjs/core';

import { MaintenanceEffect } from './MaintenanceEffect';
import { MaintenanceUpdateData } from './MaintenanceUpdateData';

export type MaintenanceAddUpdateEffect = Effect<MaintenanceEffect.AddUpdate, MaintenanceUpdateData>;
