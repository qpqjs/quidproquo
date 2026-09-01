import { askCatch, askDateNow, askNewGuid, AskResponse } from 'quidproquo';

import {
  SmokeRun,
  SmokeRunStatus,
  SmokeTestResult,
  SmokeTestStatus,
} from '@qpqjs/test-models';

import { askSaveSmokeRun } from '../../data/askSaveSmokeRun';
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

// Runs one registered test, returning its completed result entry.
function* askRunSmokeTest(
  test: SmokeTestDefinition,
  pending: SmokeTestResult
): AskResponse<SmokeTestResult> {
  const startedAt = yield* askDateNow();
  const outcome = yield* askCatch(test.askRun());
  const finishedAt = yield* askDateNow();

  return {
    ...pending,
    status: outcome.success ? SmokeTestStatus.passed : SmokeTestStatus.failed,
    message: outcome.success ? 'passed' : outcome.error.errorText,
    startedAt,
    finishedAt,
  };
}

// Executes every registered test in order, persisting the run record before
// the first test and after each one so a poll sees progress. Runs inline in
// the request for now; moving it behind a queue is the planned next pass.
export function* askExecuteSmokeRun(): AskResponse<SmokeRun> {
  const runId = yield* askNewGuid();
  const startedAt = yield* askDateNow();

  let smokeRun: SmokeRun = {
    runId,
    status: SmokeRunStatus.running,
    startedAt,
    finishedAt: null,
    tests: smokeTestRegistry.map(createPendingResult),
  };

  yield* askSaveSmokeRun(smokeRun);

  for (let index = 0; index < smokeTestRegistry.length; index += 1) {
    const result = yield* askRunSmokeTest(
      smokeTestRegistry[index],
      smokeRun.tests[index]
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
