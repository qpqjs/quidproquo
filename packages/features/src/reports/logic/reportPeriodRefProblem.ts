import { Nullable } from '@qpqjs/core';

import { REPORT_PERIOD_COUNT_MAX } from '../constants/reportPeriodCountMax';
import { ReportPeriod } from '../models/ReportPeriod';
import { ReportPeriodUnit } from '../models/ReportPeriodUnit';
import { isReportRecord } from './isReportRecord';
import { reportUnknownKeyProblem } from './reportUnknownKeyProblem';

const PERIODS: readonly unknown[] = Object.values(ReportPeriod);
const UNITS: readonly unknown[] = Object.values(ReportPeriodUnit);

/** Why a view's `period` is not a report period, or null when it is. Only a rolling period takes a count and a unit. */
export const reportPeriodRefProblem = (periodRef: unknown): Nullable<string> => {
  if (!isReportRecord(periodRef) || !PERIODS.includes(periodRef.period)) {
    return `period must be { period: ReportPeriod.<name> } with one of ${PERIODS.join(', ')}`;
  }

  if (periodRef.period !== ReportPeriod.Last) {
    return reportUnknownKeyProblem(periodRef, ['period']);
  }

  if (typeof periodRef.count !== 'number' || !Number.isInteger(periodRef.count) || periodRef.count < 1 || periodRef.count > REPORT_PERIOD_COUNT_MAX) {
    return `a rolling period (ReportPeriod.Last) needs a whole count from 1 to ${REPORT_PERIOD_COUNT_MAX}`;
  }

  if (!UNITS.includes(periodRef.unit)) {
    return `a rolling period needs a unit, one of ${UNITS.join(', ')}`;
  }

  return reportUnknownKeyProblem(periodRef, ['period', 'count', 'unit']);
};
