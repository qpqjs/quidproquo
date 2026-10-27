import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';
import { LogLog } from '@qpqjs/features';

import { VolatileEffect } from '../../effects/volatile/VolatileEffect';
import { VolatileLogLogSearchPartLoadedEffect } from '../../effects/volatile/VolatileLogLogSearchPartLoadedEffect';

export function* askUIVolatileLogLogSearchPartLoaded(searchKey: string, logLogs: LogLog[]): AskResponse<void> {
  yield* askStateDispatchEffect<VolatileLogLogSearchPartLoadedEffect>(VolatileEffect.logLogSearchPartLoaded, { searchKey, logLogs });
}
