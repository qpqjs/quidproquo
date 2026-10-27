import { Effect } from 'quidproquo-core';

import { EventDocExportUiEffect } from './EventDocExportUiEffect';

/** Empty payload: the dialog opens pristine and loads its own candidates. */
export type EventDocExportUiOpenPayload = Record<string, never>;

/** Opens the export dialog. */
export type EventDocExportUiOpenEffect = Effect<EventDocExportUiEffect.Open, EventDocExportUiOpenPayload>;
