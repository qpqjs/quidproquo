import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { EventDocListEffect } from '../effects/EventDocListEffect';
import type { EventDocListSetConfigEffect } from '../effects/EventDocListSetConfigEffect';
import type { EventDocListConfig } from '../types/EventDocListConfig';

/** Dispatches SetConfig. */
export function* askUIEventDocListSetConfig(config: EventDocListConfig): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocListSetConfigEffect>(EventDocListEffect.SetConfig, config);
}
