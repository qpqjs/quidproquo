import { Effect, Nullable } from 'quidproquo-core';

import { EventDocBundleSource, EventDocTransferPlanRow } from '../../models';
import { EventDocImportUiEffect } from './EventDocImportUiEffect';

/** Payload of SetPlan. */
export type EventDocImportUiSetPlanPayload = {
  transferId: string;
  source: Nullable<EventDocBundleSource>;
  rows: EventDocTransferPlanRow[];
};

/** Stores an uploaded bundle's plan. */
export type EventDocImportUiSetPlanEffect = Effect<EventDocImportUiEffect.SetPlan, EventDocImportUiSetPlanPayload>;
