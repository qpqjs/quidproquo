import { AskResponse, QueueEventResponse } from 'quidproquo';

import { askExecuteSmokeRun } from '../logic/smokeRun/askExecuteSmokeRun';
import { SmokeRunRequestedQueueEvent } from '../models/SmokeRunRequestedQueueEvent';

// Queue entry for a requested smoke run: executes the registered tests
// against the run record askStartSmokeRun created. A throw here (e.g. the
// record is missing) fails the message so the platform can redeliver it.
export function* onSmokeRunRequested(
  event: SmokeRunRequestedQueueEvent
): AskResponse<QueueEventResponse> {
  yield* askExecuteSmokeRun(event.message.payload.runId);

  return true;
}
