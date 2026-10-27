import { Effect, Nullable } from 'quidproquo-core';

import { EventDocListEffect } from './EventDocListEffect';

/** Payload of SetPageIndex. */
export type EventDocListSetPageIndexPayload = {
  pageIndex: number;
  // The cursor that loads this page; recorded so Previous can re-fetch it.
  cursor: Nullable<string>;
};

/** Moves the walk to a page. */
export type EventDocListSetPageIndexEffect = Effect<EventDocListEffect.SetPageIndex, EventDocListSetPageIndexPayload>;
