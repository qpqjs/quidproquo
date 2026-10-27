import { Effect } from 'quidproquo-core';

import { EventDocTransferPlanRow } from '../../models';
import { EventDocImportUiEffect } from './EventDocImportUiEffect';

/** Payload of SetResult. */
export type EventDocImportUiSetResultPayload = {
  rows: EventDocTransferPlanRow[];
};

/** Stores the apply result. */
export type EventDocImportUiSetResultEffect = Effect<EventDocImportUiEffect.SetResult, EventDocImportUiSetResultPayload>;
