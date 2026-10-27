import { Effect, Nullable } from 'quidproquo-core';

import { EventDocSummary } from '../../models';
import { EventDocListEffect } from './EventDocListEffect';

/** Payload of PageLoaded. */
export type EventDocListPageLoadedPayload = {
  items: EventDocSummary[];
  nextPageKey: Nullable<string>;
};

/** One page arrived, with the cursor for the page after it. */
export type EventDocListPageLoadedEffect = Effect<EventDocListEffect.PageLoaded, EventDocListPageLoadedPayload>;
