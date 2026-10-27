import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocListEffect } from '../effects/EventDocListEffect';
import type { EventDocListSetPageSizeEffect } from '../effects/EventDocListSetPageSizeEffect';

/** Dispatches SetPageSize. */
export function* askUIEventDocListSetPageSize(pageSize: number): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocListSetPageSizeEffect>(EventDocListEffect.SetPageSize, { pageSize });
}
