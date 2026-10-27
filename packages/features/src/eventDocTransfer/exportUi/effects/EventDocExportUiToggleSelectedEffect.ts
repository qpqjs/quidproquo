import { Effect } from 'quidproquo-core';

import { EventDocExportUiEffect } from './EventDocExportUiEffect';

/** Payload of ToggleSelected. */
export type EventDocExportUiToggleSelectedPayload = {
  id: string;
};

/** Ticks or unticks a candidate. */
export type EventDocExportUiToggleSelectedEffect = Effect<EventDocExportUiEffect.ToggleSelected, EventDocExportUiToggleSelectedPayload>;
