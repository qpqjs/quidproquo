import {
  askDateNow,
  askNewGuid,
  askQueueSendMessages,
  AskResponse,
  QueueMessage,
} from 'quidproquo';

import {
  SmokeRun,
  SmokeRunStatus,
  SmokeTestResult,
  SmokeTestStatus,
} from '@qpqjs/test-models';

import {
  SMOKE_RUN_QUEUE,
  SMOKE_RUN_REQUESTED_MESSAGE_TYPE,
} from '../../constants/smokeRunQueue';
import { askSaveSmokeRun } from '../../data/askSaveSmokeRun';
import { SmokeRunRequestedPayload } from '../../models/SmokeRunRequestedQueueEvent';
import { SmokeTestDefinition } from '../../tests/SmokeTestDefinition';
import { smokeTestRegistry } from '../../tests/smokeTestRegistry';

const createPendingResult = (
  test: SmokeTestDefinition,
  index: number
): SmokeTestResult => ({
  id: index + 1,
  name: test.name,
  status: SmokeTestStatus.pending,
  message: '',
  startedAt: null,
  finishedAt: null,
});

// Creates the run record with every registered test pending, then hands the
// run to the queue. The record exists before the message is sent so a poll
// that races the queue still finds it.
export function* askStartSmokeRun(): AskResponse<SmokeRun> {
  const runId = yield* askNewGuid();
  const startedAt = yield* askDateNow();

  const smokeRun: SmokeRun = {
    runId,
    status: SmokeRunStatus.running,
    startedAt,
    finishedAt: null,
    tests: smokeTestRegistry.map(createPendingResult),
  };

  yield* askSaveSmokeRun(smokeRun);

  const message: QueueMessage<SmokeRunRequestedPayload> = {
    type: SMOKE_RUN_REQUESTED_MESSAGE_TYPE,
    payload: { runId },
  };

  yield* askQueueSendMessages(SMOKE_RUN_QUEUE, message);

  return smokeRun;
}
