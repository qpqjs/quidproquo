import { QpqjsServiceEnum, SMOKE_CROSS_SERVICE_REPORT_APPEND_FUNCTION_NAME, SMOKE_CROSS_SERVICE_REPORT_READ_FUNCTION_NAME } from '@qpqjs/constants';
import { CrossServiceReportProbePayload, CrossServiceReportProbeResult } from '@qpqjs/testa-models';
import { askGuidNew, AskResponse, askServiceFunctionExecute, askStorageScopeProvide } from 'quidproquo';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';
import { askAwaitSmokeReportTotal } from './askAwaitSmokeReportTotal';

/**
 * The reports feature from a service that does not own the report: testa appends through its reference to this
 * service's bus, this service's queue folds the events, and testa reads them back through its references to this
 * service's stores and its own copy of the month fold. A missing grant shows up as events that never arrive or a failed read.
 */
export function* askRunCrossServiceReportsTest(): AskResponse<void> {
  const probeId = yield* askGuidNew();
  const scope = `smoke-report-cross-${probeId}`;

  const appended = yield* askServiceFunctionExecute<CrossServiceReportProbeResult, CrossServiceReportProbePayload>(
    QpqjsServiceEnum.TestA,
    SMOKE_CROSS_SERVICE_REPORT_APPEND_FUNCTION_NAME,
    { scope },
  );

  yield* askStorageScopeProvide(scope, askAwaitSmokeReportTotal(appended.total));

  const read = yield* askServiceFunctionExecute<CrossServiceReportProbeResult, CrossServiceReportProbePayload>(
    QpqjsServiceEnum.TestA,
    SMOKE_CROSS_SERVICE_REPORT_READ_FUNCTION_NAME,
    { scope },
  );

  yield* askSmokeAssert(read.total === appended.total, `testa read ${read.total} of the ${appended.total} events it appended`);
}
