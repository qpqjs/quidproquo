import { CrossServiceReportProbePayload, CrossServiceReportProbeResult } from '@qpqjs/testa-models';
import { AskResponse, ExecuteServiceFunctionEvent } from 'quidproquo';

import { askProbeForeignReportAppend } from '../../logic/askProbeForeignReportAppend';

/** Service function entry, called cross-service by the test service's reportsCrossService smoke test to append. */
export function* smokeCrossServiceReportAppend(
  event: ExecuteServiceFunctionEvent<CrossServiceReportProbePayload>,
): AskResponse<CrossServiceReportProbeResult> {
  return yield* askProbeForeignReportAppend(event.payload.scope);
}
