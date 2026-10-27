import { Effect } from 'quidproquo-core';

import { EventDocImportUiEffect } from './EventDocImportUiEffect';

/** Payload of SetLoading. */
export type EventDocImportUiSetLoadingPayload = {
  isLoading: boolean;
};

/** Sets the loading flag. */
export type EventDocImportUiSetLoadingEffect = Effect<EventDocImportUiEffect.SetLoading, EventDocImportUiSetLoadingPayload>;
