import {
  SmokeRun,
  SmokeRunWithSummary,
  SmokeTestStatus,
} from '@qpqjs/test-models';

// Derives the poll-facing counts from the stored test entries.
export const summarizeSmokeRun = (smokeRun: SmokeRun): SmokeRunWithSummary => {
  const passed = smokeRun.tests.filter(
    (t) => t.status === SmokeTestStatus.passed
  ).length;
  const failed = smokeRun.tests.filter(
    (t) => t.status === SmokeTestStatus.failed
  ).length;

  return {
    ...smokeRun,
    summary: {
      total: smokeRun.tests.length,
      completed: passed + failed,
      passed,
      failed,
    },
  };
};
