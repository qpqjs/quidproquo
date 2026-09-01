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
import { askSaveSmokeRun } from '../../data/askSaveSmokeRun';
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

// Executes every registered test for an existing run (created by
// askStartSmokeRun), persisting the record after each test so a poll sees
// progress, then finalizes the run status.
export function* askExecuteSmokeRun(runId: string): AskResponse<SmokeRun> {
  const existing = yield* askGetSmokeRunById(runId);
  if (!existing) {
    return yield* askThrowError(
      ErrorTypeEnum.NotFound,
      `no smoke run [${runId}] to execute`
    );
  }

  let smokeRun: SmokeRun = existing;

  for (let index = 0; index < smokeTestRegistry.length; index += 1) {
    const result = yield* askRunSmokeTest(
      smokeTestRegistry[index],
      smokeRun.tests[index],
      runId
    );

    smokeRun = {
      ...smokeRun,
      tests: smokeRun.tests.map((t) => (t.id === result.id ? result : t)),
    };

    yield* askSaveSmokeRun(smokeRun);
  }

  const finishedAt = yield* askDateNow();
  const anyFailed = smokeRun.tests.some(
    (t) => t.status !== SmokeTestStatus.passed
  );

  smokeRun = {
    ...smokeRun,
    status: anyFailed ? SmokeRunStatus.failed : SmokeRunStatus.passed,
    finishedAt,
  };

  yield* askSaveSmokeRun(smokeRun);

  return smokeRun;
}
