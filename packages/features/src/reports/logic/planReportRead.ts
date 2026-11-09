import { addCalendarMonths, Nullable, QpqIsoDateTime } from '@qpqjs/core';

import { REPORT_READ_MAX_MONTHS } from '../constants/reportReadMaxMonths';
import { ReportViewDefinition } from '../models/ReportViewDefinition';
import { ReportReadPlan } from '../types/ReportReadPlan';
import { ReportSpan } from '../types/ReportSpan';
import { reportBucketKeys } from './reportBucketKeys';
import { reportSpanMonthCount } from './reportSpanMonthCount';
import { reportSpanMonths } from './reportSpanMonths';
import { resolveReportComparisonSpan } from './resolveReportComparisonSpan';
import { resolveReportPeriodDays } from './resolveReportPeriodDays';

/** Everything a plan needs that is not the view: the clock, the offset and the report's settings, all passed in. */
export type ReportReadPlanInput = {
  view: ReportViewDefinition;
  now: QpqIsoDateTime;
  utcOffsetMinutes: number;
  financialYearStartMonth: number;
  retentionMonths?: number;
};

const spanProblem = (span: ReportSpan, side: string): Nullable<string> => {
  const months = reportSpanMonthCount(span.from, span.to);

  return months > REPORT_READ_MAX_MONTHS ? `the ${side} spans ${months} months; a read covers at most ${REPORT_READ_MAX_MONTHS}` : null;
};

/**
 * Resolves a view's period, and its comparison's, at `now` and the offset, and lists the month documents each must read.
 * A side spanning more than REPORT_READ_MAX_MONTHS is refused. Comparison months older than the event type's
 * retentionMonths are not read, and the comparison says so, so a widget shows "no data" rather than "+100%".
 */
export const planReportRead = ({
  view,
  now,
  utcOffsetMinutes,
  financialYearStartMonth,
  retentionMonths,
}: ReportReadPlanInput): ReportReadPlan | { problem: string } => {
  const nowKeys = reportBucketKeys(now, utcOffsetMinutes);
  const period = resolveReportPeriodDays(view.period, nowKeys.day, financialYearStartMonth);
  const periodProblem = spanProblem(period, 'period');

  if (periodProblem !== null) {
    return { problem: periodProblem };
  }

  const periodMonths = reportSpanMonths(period.from, period.to);

  if (view.compare === undefined) {
    return { period, periodMonths, comparison: null };
  }

  const span = resolveReportComparisonSpan(view.period, period, nowKeys.day, Number(nowKeys.hour.slice(11, 13)), view.compare);
  const comparisonProblem = spanProblem(span, 'comparison');

  if (comparisonProblem !== null) {
    return { problem: comparisonProblem };
  }

  const months = reportSpanMonths(span.from, span.to);
  const oldestKept = retentionMonths === undefined ? '' : addCalendarMonths(`${nowKeys.month}-01`, 1 - retentionMonths).slice(0, 7);
  const kept = months.filter((month) => month >= oldestKept);

  return { period, periodMonths, comparison: { span, months: kept, beyondRetention: kept.length < months.length } };
};
