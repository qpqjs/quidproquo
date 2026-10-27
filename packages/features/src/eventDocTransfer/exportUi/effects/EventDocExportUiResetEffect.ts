import { Effect } from 'quidproquo-core';

import { EventDocExportUiEffect } from './EventDocExportUiEffect';

/** Payload of Reset. */
export type EventDocExportUiResetPayload = Record<string, never>;

/** Returns the dialog to its initial state. */
export type EventDocExportUiResetEffect = Effect<EventDocExportUiEffect.Reset, EventDocExportUiResetPayload>;
