import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { VolatileEffect } from '../../effects/volatile/VolatileEffect';
import { VolatileLogSearchCompletedEffect } from '../../effects/volatile/VolatileLogSearchCompletedEffect';

export function* askUIVolatileLogSearchCompleted(searchKey: string, fetchedAt: string): AskResponse<void> {
  yield* askStateDispatchEffect<VolatileLogSearchCompletedEffect>(VolatileEffect.logSearchCompleted, { searchKey, fetchedAt });
}
