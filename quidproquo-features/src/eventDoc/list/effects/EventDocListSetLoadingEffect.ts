import { Effect } from 'quidproquo-core';

import { EventDocListEffect } from './EventDocListEffect';

/** Payload of SetLoading. */
export type EventDocListSetLoadingPayload = {
  isLoading: boolean;
};

/** Sets the loading flag. */
export type EventDocListSetLoadingEffect = Effect<EventDocListEffect.SetLoading, EventDocListSetLoadingPayload>;
