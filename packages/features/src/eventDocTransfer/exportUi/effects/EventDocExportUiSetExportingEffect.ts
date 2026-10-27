import { Effect } from '@qpqjs/core';

import { EventDocExportUiEffect } from './EventDocExportUiEffect';

/** Payload of SetExporting. */
export type EventDocExportUiSetExportingPayload = {
  isExporting: boolean;
};

/** Sets the exporting flag. */
export type EventDocExportUiSetExportingEffect = Effect<EventDocExportUiEffect.SetExporting, EventDocExportUiSetExportingPayload>;
