import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { EventDocSummary } from '../../../eventDoc/models';
import { EventDocExportUiEffect } from '../effects/EventDocExportUiEffect';
import type { EventDocExportUiSetCandidatesEffect } from '../effects/EventDocExportUiSetCandidatesEffect';

/** Dispatches SetCandidates. */
export function* askUIEventDocExportSetCandidates(candidates: EventDocSummary[]): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocExportUiSetCandidatesEffect>(EventDocExportUiEffect.SetCandidates, { candidates });
}
