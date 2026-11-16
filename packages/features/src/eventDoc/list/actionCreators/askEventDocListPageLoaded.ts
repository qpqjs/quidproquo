import { AskResponse, askStateDispatchEffect, Nullable } from '@qpqjs/core';

import { EventDocListEffect } from '../effects/EventDocListEffect';
import type { EventDocListPageLoadedEffect } from '../effects/EventDocListPageLoadedEffect';
import type { EventDocListRow } from '../types/EventDocListRow';

/** Dispatches PageLoaded with the page rows and the cursor for the page after. */
export function* askEventDocListPageLoaded(items: EventDocListRow[], nextPageKey: Nullable<string>): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocListPageLoadedEffect>(EventDocListEffect.PageLoaded, { items, nextPageKey });
}
