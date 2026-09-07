import { Effect } from 'quidproquo-core';

import { EventDocListEffect } from './EventDocListEffect';

/** Payload of SetPageSize. */
export type EventDocListSetPageSizePayload = {
  pageSize: number;
};

/** Sets the page size and restarts the walk. */
export type EventDocListSetPageSizeEffect = Effect<EventDocListEffect.SetPageSize, EventDocListSetPageSizePayload>;
