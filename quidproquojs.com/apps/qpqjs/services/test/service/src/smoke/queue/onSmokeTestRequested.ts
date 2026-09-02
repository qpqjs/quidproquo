import { AskResponse, QueueEventResponse } from 'quidproquo';

import { askExecuteSmokeTest } from '../logic/smokeRun/askExecuteSmokeTest';
import { SmokeTestRequestedQueueEvent } from '../models/SmokeTestRequestedQueueEvent';

// Queue entry for one test of a smoke run: executes it against the run record
// askStartSmokeRun created and records its result. A throw here (e.g. the
// record is missing) fails the message so the platform can redeliver it.
export function* onSmokeTestRequested(
  event: SmokeTestRequestedQueueEvent
): AskResponse<QueueEventResponse> {
  const { runId, testName } = event.message.payload;

  yield* askExecuteSmokeTest(runId, testName);

  return true;
}
