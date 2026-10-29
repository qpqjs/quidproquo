import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { VolatileEffect } from '../../effects/volatile/VolatileEffect';
import { VolatileServiceNamesLoadedEffect } from '../../effects/volatile/VolatileServiceNamesLoadedEffect';

export function* askVolatileServiceNamesLoaded(serviceNames: string[], logServiceName: string): AskResponse<void> {
  yield* askStateDispatchEffect<VolatileServiceNamesLoadedEffect>(VolatileEffect.serviceNamesLoaded, { serviceNames, logServiceName });
}
