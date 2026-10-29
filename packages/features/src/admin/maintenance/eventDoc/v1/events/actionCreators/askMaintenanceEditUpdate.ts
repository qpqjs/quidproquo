import { AskResponse } from '@qpqjs/core';

import { askApplyEventDocEvent } from '../../../../../../eventDoc/actions/askApplyEventDocEvent';
import { MaintenanceEditUpdateEffect } from '../effects/MaintenanceEditUpdateEffect';
import { MaintenanceEffect } from '../effects/MaintenanceEffect';
import { MaintenanceUpdateData } from '../effects/MaintenanceUpdateData';

export function* askMaintenanceEditUpdate(update: MaintenanceUpdateData): AskResponse<void> {
  yield* askApplyEventDocEvent<MaintenanceEditUpdateEffect>(MaintenanceEffect.EditUpdate, update);
}
