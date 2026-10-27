import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { VolatileEffect } from '../../effects/volatile/VolatileEffect';
import { VolatileLogSearchStartedEffect } from '../../effects/volatile/VolatileLogSearchStartedEffect';

export function* askUIVolatileLogSearchStarted(searchKey: string, partsTotal: number): AskResponse<void> {
  yield* askStateDispatchEffect<VolatileLogSearchStartedEffect>(VolatileEffect.logSearchStarted, { searchKey, partsTotal });
}
