import { SMOKE_REPORT_NAME, SMOKE_REPORT_VIEW_NAME } from '@qpqjs/constants';
import { askReportRead } from '@qpqjs/features';
import { CrossServiceReportProbeResult } from '@qpqjs/testa-models';
import { AskResponse, askStorageScopeProvide } from 'quidproquo';

/**
 * Reads the smoke report's declared view under `scope`, through THIS service's references to the test service's month
 * document stores and its own registration of the month fold.
 */
export function* askProbeForeignReportRead(scope: string): AskResponse<CrossServiceReportProbeResult> {
  const result = yield* askStorageScopeProvide(scope, askReportRead(SMOKE_REPORT_NAME, SMOKE_REPORT_VIEW_NAME));

  return { total: result.total };
}
