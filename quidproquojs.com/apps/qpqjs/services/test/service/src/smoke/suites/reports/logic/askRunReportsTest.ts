import { SMOKE_REPORT_EVENT_TYPE, SMOKE_REPORT_NAME, SMOKE_REPORT_VIEW_NAME } from '@qpqjs/constants';
import { askReportAppend, askReportRead, ReportPeriod } from '@qpqjs/features';
import { askGuidNew, AskResponse, askStorageScopeProvide } from 'quidproquo';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';
import { askAwaitSmokeReportTotal } from './askAwaitSmokeReportTotal';

const rendered = (kind: string, outcome: string, pages: number) => ({
  type: SMOKE_REPORT_EVENT_TYPE,
  dimensions: { kind, outcome },
  measures: { pages },
});

// The owner's own round trip, in one scope: append, wait for the queue to fold the events into a month document, read.
function* askRunScopedReportsTest(scope: string): AskResponse<void> {
  yield* askReportAppend(SMOKE_REPORT_NAME, [rendered('docx', 'ok', 2), rendered('docx', 'ok', 3), rendered('pdf', 'failed', 5)]);

  const byKind = yield* askAwaitSmokeReportTotal(3);

  yield* askSmokeAssert(
    byKind.sums.pages === 10 && byKind.mins.pages === 2 && byKind.maxes.pages === 5,
    `pages summed ${JSON.stringify(byKind.sums)}`,
  );
  yield* askSmokeAssert(
    JSON.stringify(byKind.groups?.map((group) => [group.value, group.count, group.sums.pages])) ===
      JSON.stringify([
        ['docx', 2, 5],
        ['pdf', 1, 5],
      ]),
    `groups by kind were ${JSON.stringify(byKind.groups)}`,
  );
  yield* askSmokeAssert(byKind.buckets?.length === 7, `the last 7 days drew ${byKind.buckets?.length} daily buckets`);

  const failed = yield* askReportRead(SMOKE_REPORT_NAME, {
    event: SMOKE_REPORT_EVENT_TYPE,
    period: { period: ReportPeriod.Last7Days },
    filter: { outcome: 'failed' },
  });
  yield* askSmokeAssert(failed.total === 1, `the failed filter counted ${failed.total}`);

  const otherScope = yield* askStorageScopeProvide(`${scope}-other`, askReportRead(SMOKE_REPORT_NAME, SMOKE_REPORT_VIEW_NAME));
  yield* askSmokeAssert(otherScope.total === 0, `another scope read ${otherScope.total} of this scope's events`);
}

/**
 * The reports feature end to end on the owner: an append crosses the FIFO bus and queue, the consumer folds it into a month
 * document in the appender's scope, and a read adds up its cells. A fresh scope per run keeps runs apart.
 */
export function* askRunReportsTest(): AskResponse<void> {
  const probeId = yield* askGuidNew();
  const scope = `smoke-report-${probeId}`;

  yield* askStorageScopeProvide(scope, askRunScopedReportsTest(scope));
}
