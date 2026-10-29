import { AskResponse, askStateDispatchEffect, Nullable } from '@qpqjs/core';

import { EventDocListEffect } from '../effects/EventDocListEffect';
import type { EventDocListSetPageIndexEffect } from '../effects/EventDocListSetPageIndexEffect';

/** Dispatches SetPageIndex with the cursor that loads the page. */
export function* askEventDocListSetPageIndex(pageIndex: number, cursor: Nullable<string>): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocListSetPageIndexEffect>(EventDocListEffect.SetPageIndex, { pageIndex, cursor });
}
