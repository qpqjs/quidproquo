import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { EventDocSummary } from '../../../eventDoc/models';
import { EventDocExportUiEffect } from '../effects/EventDocExportUiEffect';
import type { EventDocExportUiSetCandidatesEffect } from '../effects/EventDocExportUiSetCandidatesEffect';

/** Dispatches SetCandidates. */
export function* askEventDocExportSetCandidates(candidates: EventDocSummary[]): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocExportUiSetCandidatesEffect>(EventDocExportUiEffect.SetCandidates, { candidates });
}
