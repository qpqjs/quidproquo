import {
  AskResponse,
  HTTPEvent,
  HTTPEventResponse,
  qpqWebServerUtils,
} from 'quidproquo';

import { askStartSmokeRun } from '../logic/smokeRun/askStartSmokeRun';

// POST /smoke/run. Auth happened in the route preamble via the GitHub OIDC
// decode override attached to this route's runtime. Starts the run on the
// queue and hands back the runId; status is polled separately.
export function* askRunSmokeTests(
  event: HTTPEvent
): AskResponse<HTTPEventResponse> {
  const smokeRun = yield* askStartSmokeRun();

  return qpqWebServerUtils.toJsonEventResponse({ runId: smokeRun.runId });
}
