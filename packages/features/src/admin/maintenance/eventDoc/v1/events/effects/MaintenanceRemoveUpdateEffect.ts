import { Effect } from '@qpqjs/core';

import { MaintenanceEffect } from './MaintenanceEffect';

export type MaintenanceRemoveUpdateData = { updateId: string };

export type MaintenanceRemoveUpdateEffect = Effect<MaintenanceEffect.RemoveUpdate, MaintenanceRemoveUpdateData>;
