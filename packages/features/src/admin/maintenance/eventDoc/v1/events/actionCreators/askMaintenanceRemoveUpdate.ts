import { AskResponse } from '@qpqjs/core';

import { askApplyEventDocEvent } from '../../../../../../eventDoc/actions/askApplyEventDocEvent';
import { MaintenanceEffect } from '../effects/MaintenanceEffect';
import { MaintenanceRemoveUpdateEffect } from '../effects/MaintenanceRemoveUpdateEffect';

export function* askMaintenanceRemoveUpdate(updateId: string): AskResponse<void> {
  yield* askApplyEventDocEvent<MaintenanceRemoveUpdateEffect>(MaintenanceEffect.RemoveUpdate, { updateId });
}
