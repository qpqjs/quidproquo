import { SMOKE_REPORT_NAME, SMOKE_REPORT_VIEW_NAME } from '@qpqjs/constants';
import { askReportRead, ReportReadResult, ReportViewDefinition } from '@qpqjs/features';
import { askPlatformDelay, AskResponse } from 'quidproquo';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';

// Covers the bus, the FIFO queue's delivery and the consumer's append, on the dev server and deployed.
const POLL_ATTEMPTS = 15;
const POLL_INTERVAL_MS = 2000;

/**
 * Reads a view of the smoke report, in the current scope, until its total reaches `expected` (the consumer folds a few
 * seconds after an append), failing the test if it never does or overshoots. Returns the read that reached it.
 */
export function* askAwaitSmokeReportTotal(
  expected: number,
  view: string | ReportViewDefinition = SMOKE_REPORT_VIEW_NAME,
): AskResponse<ReportReadResult> {
  for (let attempt = 1; attempt < POLL_ATTEMPTS; attempt += 1) {
    const result = yield* askReportRead(SMOKE_REPORT_NAME, view);

    if (result.total >= expected) {
      yield* askSmokeAssert(result.total === expected, `the smoke report counted ${result.total} events, expected ${expected}`);
      return result;
    }

    yield* askPlatformDelay(POLL_INTERVAL_MS);
  }

  const last = yield* askReportRead(SMOKE_REPORT_NAME, view);
  yield* askSmokeAssert(last.total === expected, `the smoke report counted ${last.total} of ${expected} events after ${POLL_ATTEMPTS} reads`);

  return last;
}
