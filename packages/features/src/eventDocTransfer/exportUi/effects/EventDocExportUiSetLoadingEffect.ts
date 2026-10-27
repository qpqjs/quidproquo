import { Effect } from '@qpqjs/core';

import { EventDocExportUiEffect } from './EventDocExportUiEffect';

/** Payload of SetLoading. */
export type EventDocExportUiSetLoadingPayload = {
  isLoading: boolean;
};

/** Sets the loading flag. */
export type EventDocExportUiSetLoadingEffect = Effect<EventDocExportUiEffect.SetLoading, EventDocExportUiSetLoadingPayload>;
