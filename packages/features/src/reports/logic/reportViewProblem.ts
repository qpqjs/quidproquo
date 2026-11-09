import { Nullable } from '@qpqjs/core';

import { ReportBucket } from '../models/ReportBucket';
import { ReportCompare } from '../models/ReportCompare';
import { ReportPeriod } from '../models/ReportPeriod';
import { isReportRecord } from './isReportRecord';
import { reportDimensionsProblem } from './reportDimensionsProblem';
import { reportPeriodRefProblem } from './reportPeriodRefProblem';
import { reportUnknownKeyProblem } from './reportUnknownKeyProblem';

const VIEW_KEYS = ['event', 'period', 'bucket', 'groupBy', 'filter', 'measure', 'compare', 'groupLimit'] as const;
const BUCKETS: readonly unknown[] = Object.values(ReportBucket);
const COMPARES: readonly unknown[] = Object.values(ReportCompare);

// The hourly cells hold the newest event's local day and the one before, so only today and yesterday can be read by the
// hour, and only today against yesterday can be compared by the hour.
const HOURLY_PERIODS: readonly unknown[] = [ReportPeriod.Today, ReportPeriod.Yesterday];

const isOptionalName = (value: unknown): boolean => value === undefined || (typeof value === 'string' && value.length > 0);

// The rules that need more than one field: what the stored hours and days can answer.
const reportViewCombinationProblem = (view: Record<string, unknown>, period: unknown): Nullable<string> => {
  if (view.bucket === ReportBucket.Hour && !HOURLY_PERIODS.includes(period)) {
    return 'an hourly bucket can only read today or yesterday';
  }

  if (
    view.bucket === ReportBucket.Hour &&
    view.compare !== undefined &&
    !(view.compare === ReportCompare.PreviousPeriod && period === ReportPeriod.Today)
  ) {
    return 'an hourly comparison can only set today against yesterday (ReportCompare.PreviousPeriod on ReportPeriod.Today)';
  }

  if (period === ReportPeriod.Today && (view.compare === ReportCompare.SameDayLastWeek || view.compare === ReportCompare.SamePeriodLastYear)) {
    return 'today can only be compared with yesterday: the hours needed to stop an earlier day at the same time are not kept';
  }

  return null;
};

/** Why a value is not a report view, or null when it is one. Checks shape only: event types are never declared. */
export const reportViewProblem = (view: unknown): Nullable<string> => {
  if (!isReportRecord(view)) {
    return 'a view must be an object';
  }

  const shapeProblem =
    reportUnknownKeyProblem(view, VIEW_KEYS) ??
    (typeof view.event === 'string' && view.event.length > 0 ? null : 'event must name an event type') ??
    reportPeriodRefProblem(view.period) ??
    (view.bucket === undefined || BUCKETS.includes(view.bucket) ? null : `bucket must be one of ${BUCKETS.join(', ')}`) ??
    (view.compare === undefined || COMPARES.includes(view.compare) ? null : `compare must be one of ${COMPARES.join(', ')}`) ??
    (isOptionalName(view.groupBy) ? null : 'groupBy must name a dimension') ??
    (isOptionalName(view.measure) ? null : 'measure must name a measure') ??
    (view.filter === undefined ? null : reportDimensionsProblem(view.filter)) ??
    (view.groupLimit === undefined || (typeof view.groupLimit === 'number' && Number.isInteger(view.groupLimit) && view.groupLimit >= 1)
      ? null
      : 'groupLimit must be a whole number of at least 1');

  return shapeProblem ?? reportViewCombinationProblem(view, isReportRecord(view.period) ? view.period.period : undefined);
};
