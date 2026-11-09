import { SMOKE_REPORT_EVENT_TYPE, SMOKE_REPORT_NAME } from '@qpqjs/constants';
import { askReportAppend, ReportEvent } from '@qpqjs/features';
import { CrossServiceReportProbeResult } from '@qpqjs/testa-models';
import { AskResponse, askStorageScopeProvide } from 'quidproquo';

const EVENTS: ReportEvent[] = [
  { type: SMOKE_REPORT_EVENT_TYPE, dimensions: { kind: 'xlsx', outcome: 'ok' }, measures: { pages: 1 } },
  { type: SMOKE_REPORT_EVENT_TYPE, dimensions: { kind: 'xlsx', outcome: 'ok' }, measures: { pages: 4 } },
];

/** Appends to the test service's smoke report under `scope`, publishing through THIS service's reference to its bus. */
export function* askProbeForeignReportAppend(scope: string): AskResponse<CrossServiceReportProbeResult> {
  yield* askStorageScopeProvide(scope, askReportAppend(SMOKE_REPORT_NAME, EVENTS));

  return { total: EVENTS.length };
}
