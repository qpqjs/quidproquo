import { AskResponse, askStateDispatchEffect, Nullable } from 'quidproquo-core';

import { EventDocSummary } from '../../models';
import { EventDocListEffect } from '../effects/EventDocListEffect';
import type { EventDocListPageLoadedEffect } from '../effects/EventDocListPageLoadedEffect';

/** Dispatches PageLoaded with the page rows and the cursor for the page after. */
export function* askUIEventDocListPageLoaded(items: EventDocSummary[], nextPageKey: Nullable<string>): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocListPageLoadedEffect>(EventDocListEffect.PageLoaded, { items, nextPageKey });
}
