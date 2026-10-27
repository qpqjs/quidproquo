import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { VolatileEffect } from '../../effects/volatile/VolatileEffect';
import { VolatileLogLogSearchStartedEffect } from '../../effects/volatile/VolatileLogLogSearchStartedEffect';

export function* askUIVolatileLogLogSearchStarted(searchKey: string, partsTotal: number): AskResponse<void> {
  yield* askStateDispatchEffect<VolatileLogLogSearchStartedEffect>(VolatileEffect.logLogSearchStarted, { searchKey, partsTotal });
}
