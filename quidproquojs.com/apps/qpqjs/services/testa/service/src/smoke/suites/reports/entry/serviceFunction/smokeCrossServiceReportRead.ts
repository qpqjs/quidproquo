import { CrossServiceReportProbePayload, CrossServiceReportProbeResult } from '@qpqjs/testa-models';
import { AskResponse, ExecuteServiceFunctionEvent } from 'quidproquo';

import { askProbeForeignReportRead } from '../../logic/askProbeForeignReportRead';

/** Service function entry, called cross-service by the test service's reportsCrossService smoke test to read back. */
export function* smokeCrossServiceReportRead(
  event: ExecuteServiceFunctionEvent<CrossServiceReportProbePayload>,
): AskResponse<CrossServiceReportProbeResult> {
  return yield* askProbeForeignReportRead(event.payload.scope);
}
