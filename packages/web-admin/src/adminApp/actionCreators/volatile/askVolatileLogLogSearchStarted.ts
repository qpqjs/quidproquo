import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { VolatileEffect } from '../../effects/volatile/VolatileEffect';
import { VolatileLogLogSearchStartedEffect } from '../../effects/volatile/VolatileLogLogSearchStartedEffect';

export function* askVolatileLogLogSearchStarted(searchKey: string, partsTotal: number): AskResponse<void> {
  yield* askStateDispatchEffect<VolatileLogLogSearchStartedEffect>(VolatileEffect.logLogSearchStarted, { searchKey, partsTotal });
}
