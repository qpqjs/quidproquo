import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocTransferExportResult } from '../../models';
import { EventDocExportUiEffect } from '../effects/EventDocExportUiEffect';
import type { EventDocExportUiSetResultEffect } from '../effects/EventDocExportUiSetResultEffect';

/** Dispatches SetResult. */
export function* askEventDocExportSetResult(result: EventDocTransferExportResult): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocExportUiSetResultEffect>(EventDocExportUiEffect.SetResult, { result });
}
