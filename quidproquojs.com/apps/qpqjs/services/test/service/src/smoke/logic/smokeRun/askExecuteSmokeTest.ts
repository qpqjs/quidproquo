import {
  askCatch,
  askDateNow,
  AskResponse,
  askThrowError,
  ErrorTypeEnum,
} from 'quidproquo';

import {
  SmokeRun,
  SmokeRunStatus,
  SmokeTestResult,
  SmokeTestStatus,
} from '@qpqjs/test-models';

import { askGetSmokeRunById } from '../../data/askGetSmokeRunById';
import { askRecordSmokeTestResult } from '../../data/askRecordSmokeTestResult';
import { askSetSmokeRunOutcome } from '../../data/askSetSmokeRunOutcome';
import { SmokeTestDefinition } from '../../tests/SmokeTestDefinition';
import { smokeTestRegistry } from '../../tests/smokeTestRegistry';

// Runs one registered test, returning its completed result entry.
function* askRunSmokeTest(
  test: SmokeTestDefinition,
  pending: SmokeTestResult,
  runId: string
): AskResponse<SmokeTestResult> {
  const startedAt = yield* askDateNow();
  const outcome = yield* askCatch(test.askRun(runId));
  const finishedAt = yield* askDateNow();

  return {
    ...pending,
    status: outcome.success ? SmokeTestStatus.passed : SmokeTestStatus.failed,
    message: outcome.success ? 'passed' : outcome.error.errorText,
    startedAt,
    finishedAt,
  };
}

const isTerminal = (result: SmokeTestResult): boolean =>
  result.status === SmokeTestStatus.passed ||
  result.status === SmokeTestStatus.failed;

// Executes one registered test for an existing run (created by
// askStartSmokeRun) and records its result. Every test of a run executes
// concurrently through its own queue message, so nobody owns the run's
// finish: the write of each result returns the record as it stands, and
// because writes to one record serialize, exactly one worker (whichever
// lands last) sees every test terminal. That worker stamps the run's outcome.
export function* askExecuteSmokeTest(
  runId: string,
  testName: string
): AskResponse<SmokeRun> {
  const test = smokeTestRegistry.find((t) => t.name === testName);
  if (!test) {
    return yield* askThrowError(
      ErrorTypeEnum.NotFound,
      `no smoke test [${testName}] registered`
    );
  }

  const smokeRun = yield* askGetSmokeRunById(runId);
  if (!smokeRun) {
    return yield* askThrowError(
      ErrorTypeEnum.NotFound,
      `no smoke run [${runId}] to execute`
    );
  }

  const testIndex = smokeRun.tests.findIndex((t) => t.name === testName);
  if (testIndex < 0) {
    return yield* askThrowError(
      ErrorTypeEnum.NotFound,
      `smoke run [${runId}] has no entry for test [${testName}]`
    );
  }

  const result = yield* askRunSmokeTest(test, smokeRun.tests[testIndex], runId);

  const recorded = yield* askRecordSmokeTestResult(runId, testIndex, result);

  if (!recorded.tests.every(isTerminal)) {
    return recorded;
  }

  const finishedAt = yield* askDateNow();
  const anyFailed = recorded.tests.some(
    (t) => t.status !== SmokeTestStatus.passed
  );

  return yield* askSetSmokeRunOutcome(
    runId,
    anyFailed ? SmokeRunStatus.failed : SmokeRunStatus.passed,
    finishedAt
  );
}
