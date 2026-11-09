import { QpqjsServiceEnum, SMOKE_REPORT_EVENT_TYPE, SMOKE_REPORT_NAME, SMOKE_REPORT_VIEW_NAME } from '@qpqjs/constants';
import { defineReports, ReportBucket, ReportPeriod } from '@qpqjs/features';
import { QPQConfig } from 'quidproquo';

/**
 * The reports smoke suite's report. A report is declared identically in every service that uses it: test owns it (its
 * deploy creates the bus, stores and folding queue), testa references it and appends to and reads from it.
 */
export const defineSmokeReport = (): QPQConfig =>
  defineReports(SMOKE_REPORT_NAME, {
    owner: { module: QpqjsServiceEnum.Test },
    utcOffset: '+10:00',
    scoped: true,
    views: {
      [SMOKE_REPORT_VIEW_NAME]: {
        event: SMOKE_REPORT_EVENT_TYPE,
        period: { period: ReportPeriod.Last7Days },
        bucket: ReportBucket.Day,
        groupBy: 'kind',
      },
    },
  });
