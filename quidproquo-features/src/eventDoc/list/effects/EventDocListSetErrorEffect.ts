import { Effect, Nullable } from 'quidproquo-core';

import { EventDocListEffect } from './EventDocListEffect';

/** Payload of SetError. */
export type EventDocListSetErrorPayload = {
  error: Nullable<string>;
};

/** Sets or clears the error. */
export type EventDocListSetErrorEffect = Effect<EventDocListEffect.SetError, EventDocListSetErrorPayload>;
