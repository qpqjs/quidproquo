import {
  AskResponse,
  HTTPEvent,
  HTTPEventResponse,
  qpqWebServerUtils,
} from 'quidproquo';

import { askFindSmokeRun } from '../logic/smokeRun/askFindSmokeRun';
import { summarizeSmokeRun } from '../logic/smokeRun/summarizeSmokeRun';

// GET /smoke/run/{runId}. The deployed-smoke script polls this until the run
// leaves 'running' or its deadline passes.
export function* askGetSmokeRun(
  event: HTTPEvent,
  params: { runId: string }
): AskResponse<HTTPEventResponse> {
  const smokeRun = yield* askFindSmokeRun(params.runId);

  if (!smokeRun) {
    return qpqWebServerUtils.toJsonEventResponse(
      { message: `no smoke run [${params.runId}]` },
      404
    );
  }

  return qpqWebServerUtils.toJsonEventResponse(summarizeSmokeRun(smokeRun));
}
