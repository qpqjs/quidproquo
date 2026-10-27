import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { VolatileEffect } from '../../effects/volatile/VolatileEffect';
import { VolatileLogLogSearchCompletedEffect } from '../../effects/volatile/VolatileLogLogSearchCompletedEffect';

export function* askUIVolatileLogLogSearchCompleted(searchKey: string, fetchedAt: string): AskResponse<void> {
  yield* askStateDispatchEffect<VolatileLogLogSearchCompletedEffect>(VolatileEffect.logLogSearchCompleted, { searchKey, fetchedAt });
}
