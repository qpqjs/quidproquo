import { Effect } from 'quidproquo-core';

import { EventDocTransferExportResult } from '../../models';
import { EventDocExportUiEffect } from './EventDocExportUiEffect';

/** Payload of SetResult. */
export type EventDocExportUiSetResultPayload = {
  result: EventDocTransferExportResult;
};

/** Stores the export result. */
export type EventDocExportUiSetResultEffect = Effect<EventDocExportUiEffect.SetResult, EventDocExportUiSetResultPayload>;
