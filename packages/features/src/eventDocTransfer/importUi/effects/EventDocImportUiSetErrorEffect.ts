import { Effect, Nullable } from '@qpqjs/core';

import { EventDocImportUiEffect } from './EventDocImportUiEffect';

/** Payload of SetError. */
export type EventDocImportUiSetErrorPayload = {
  error: Nullable<string>;
};

/** Sets or clears the error. */
export type EventDocImportUiSetErrorEffect = Effect<EventDocImportUiEffect.SetError, EventDocImportUiSetErrorPayload>;
