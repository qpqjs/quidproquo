import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { EventDocTransferPlanRow } from '../../models';
import { EventDocImportUiEffect } from '../effects/EventDocImportUiEffect';
import type { EventDocImportUiSetResultEffect } from '../effects/EventDocImportUiSetResultEffect';

/** Dispatches SetResult. */
export function* askUIEventDocImportSetResult(rows: EventDocTransferPlanRow[]): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocImportUiSetResultEffect>(EventDocImportUiEffect.SetResult, { rows });
}
