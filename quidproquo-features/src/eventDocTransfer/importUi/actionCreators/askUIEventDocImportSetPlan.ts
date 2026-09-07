import { AskResponse, askStateDispatchEffect, Nullable } from 'quidproquo-core';

import { EventDocBundleSource, EventDocTransferPlanRow } from '../../models';
import { EventDocImportUiEffect } from '../effects/EventDocImportUiEffect';
import type { EventDocImportUiSetPlanEffect } from '../effects/EventDocImportUiSetPlanEffect';

/** Dispatches SetPlan. */
export function* askUIEventDocImportSetPlan(
  transferId: string,
  source: Nullable<EventDocBundleSource>,
  rows: EventDocTransferPlanRow[],
): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocImportUiSetPlanEffect>(EventDocImportUiEffect.SetPlan, { transferId, source, rows });
}
