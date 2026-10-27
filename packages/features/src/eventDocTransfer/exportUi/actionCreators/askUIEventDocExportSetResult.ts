import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { EventDocTransferExportResult } from '../../models';
import { EventDocExportUiEffect } from '../effects/EventDocExportUiEffect';
import type { EventDocExportUiSetResultEffect } from '../effects/EventDocExportUiSetResultEffect';

/** Dispatches SetResult. */
export function* askUIEventDocExportSetResult(result: EventDocTransferExportResult): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocExportUiSetResultEffect>(EventDocExportUiEffect.SetResult, { result });
}
