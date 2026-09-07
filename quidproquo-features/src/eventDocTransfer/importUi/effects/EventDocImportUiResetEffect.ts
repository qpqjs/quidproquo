import { Effect } from 'quidproquo-core';

import { EventDocImportUiEffect } from './EventDocImportUiEffect';

/** Payload of Reset. */
export type EventDocImportUiResetPayload = Record<string, never>;

/** Returns the screen to its initial state. */
export type EventDocImportUiResetEffect = Effect<EventDocImportUiEffect.Reset, EventDocImportUiResetPayload>;
