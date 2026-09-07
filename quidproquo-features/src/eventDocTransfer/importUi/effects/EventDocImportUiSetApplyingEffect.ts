import { Effect } from 'quidproquo-core';

import { EventDocImportUiEffect } from './EventDocImportUiEffect';

/** Payload of SetApplying. */
export type EventDocImportUiSetApplyingPayload = {
  isApplying: boolean;
};

/** Sets the applying flag. */
export type EventDocImportUiSetApplyingEffect = Effect<EventDocImportUiEffect.SetApplying, EventDocImportUiSetApplyingPayload>;
