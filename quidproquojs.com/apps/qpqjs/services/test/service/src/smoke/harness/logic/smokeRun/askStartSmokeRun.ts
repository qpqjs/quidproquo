import {
  askDateNow,
  askNewGuid,
  askPlatformGetName,
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
import { SmokeTestDefinition } from '../../types/SmokeTestDefinition';
import { listSmokeTests } from './listSmokeTests';

const createInitialResult = (
  test: SmokeTestDefinition,
  index: number,
  skip: boolean
): SmokeTestResult => ({
  id: index + 1,
  name: test.name,
  status: skip ? SmokeTestStatus.skipped : SmokeTestStatus.pending,
  message: skip ? 'deployed only' : '',
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

// Creates the run record with every registered test pending (or skipped, for
// a deployed-only test on the dev server), then sends one queue message per
// pending test so they execute in parallel. The record exists before the
// messages are sent so a poll (or a worker) that races the queue still finds
// it. A run of nothing but skips never gets a worker, so it is finished here.
export function* askStartSmokeRun(): AskResponse<SmokeRun> {
  const runId = yield* askNewGuid();
  const startedAt = yield* askDateNow();
  const platformName = yield* askPlatformGetName();

  const shouldSkip = (test: SmokeTestDefinition): boolean =>
    !!test.deployedOnly && platformName === 'devServer';

  const smokeTests = listSmokeTests();
  const queued = smokeTests.filter((test) => !shouldSkip(test));

  const smokeRun: SmokeRun = {
    runId,
    status:
      queued.length === 0 ? SmokeRunStatus.passed : SmokeRunStatus.running,
    startedAt,
    finishedAt: queued.length === 0 ? startedAt : null,
    tests: smokeTests.map((test, index) =>
      createInitialResult(test, index, shouldSkip(test))
    ),
  };

  yield* askSaveSmokeRun(smokeRun);

  const messages = queued.map((test) =>
    createTestRequestedMessage(runId, test)
  );

  if (messages.length > 0) {
    yield* askQueueSendMessages(SMOKE_RUN_QUEUE, ...messages);
  }

  return smokeRun;
}
