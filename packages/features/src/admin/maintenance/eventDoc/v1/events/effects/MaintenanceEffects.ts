import type { MaintenanceAddUpdateEffect } from './MaintenanceAddUpdateEffect';
import type { MaintenanceEditUpdateEffect } from './MaintenanceEditUpdateEffect';
import type { MaintenanceRemoveUpdateEffect } from './MaintenanceRemoveUpdateEffect';

export type MaintenanceEffects = MaintenanceAddUpdateEffect | MaintenanceEditUpdateEffect | MaintenanceRemoveUpdateEffect;
