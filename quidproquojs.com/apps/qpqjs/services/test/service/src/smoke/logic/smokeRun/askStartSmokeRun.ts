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
  SMOKE_TEST_REQUESTED_MESSAGE_TYPE,
} from '../../constants/smokeRunQueue';
import { askSaveSmokeRun } from '../../data/askSaveSmokeRun';
import { SmokeTestRequestedPayload } from '../../models/SmokeTestRequestedQueueEvent';
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

const createTestRequestedMessage = (
  runId: string,
  test: SmokeTestDefinition
): QueueMessage<SmokeTestRequestedPayload> => ({
  type: SMOKE_TEST_REQUESTED_MESSAGE_TYPE,
  payload: { runId, testName: test.name },
});

// Creates the run record with every registered test pending, then sends one
// queue message per test so they execute in parallel. The record exists
// before the messages are sent so a poll (or a worker) that races the queue
// still finds it.
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

  const messages = smokeTestRegistry.map((test) =>
    createTestRequestedMessage(runId, test)
  );

  yield* askQueueSendMessages(SMOKE_RUN_QUEUE, ...messages);

  return smokeRun;
}
