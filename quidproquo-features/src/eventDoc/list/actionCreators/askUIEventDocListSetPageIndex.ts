import { AskResponse, askStateDispatchEffect, Nullable } from 'quidproquo-core';

import { EventDocListEffect } from '../effects/EventDocListEffect';
import type { EventDocListSetPageIndexEffect } from '../effects/EventDocListSetPageIndexEffect';

/** Dispatches SetPageIndex with the cursor that loads the page. */
export function* askUIEventDocListSetPageIndex(pageIndex: number, cursor: Nullable<string>): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocListSetPageIndexEffect>(EventDocListEffect.SetPageIndex, { pageIndex, cursor });
}
