import {
  AskResponse,
  HTTPEvent,
  HTTPEventResponse,
  qpqWebServerUtils,
} from 'quidproquo';

import { askExecuteSmokeRun } from '../logic/smokeRun/askExecuteSmokeRun';

// POST /smoke/run. Auth happened in the route preamble via the GitHub OIDC
// decode override attached to this route's runtime. The response contract is
// fixed for part 3: hand back the runId, status is polled separately.
export function* askRunSmokeTests(
  event: HTTPEvent
): AskResponse<HTTPEventResponse> {
  const smokeRun = yield* askExecuteSmokeRun();

  return qpqWebServerUtils.toJsonEventResponse({ runId: smokeRun.runId });
}
