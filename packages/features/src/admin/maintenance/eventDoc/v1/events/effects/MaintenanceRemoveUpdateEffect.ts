import { Effect } from 'quidproquo-core';

import { MaintenanceEffect } from './MaintenanceEffect';

export type MaintenanceRemoveUpdateData = { updateId: string };

export type MaintenanceRemoveUpdateEffect = Effect<MaintenanceEffect.RemoveUpdate, MaintenanceRemoveUpdateData>;
