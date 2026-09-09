import { Effect, Nullable } from 'quidproquo-core';

import { EventDocExportUiEffect } from './EventDocExportUiEffect';

/** Payload of SetError. */
export type EventDocExportUiSetErrorPayload = {
  error: Nullable<string>;
};

/** Sets or clears the error. */
export type EventDocExportUiSetErrorEffect = Effect<EventDocExportUiEffect.SetError, EventDocExportUiSetErrorPayload>;
