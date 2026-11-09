import { addCalendarMonths, Nullable } from '@qpqjs/core';

import { ReportCompare } from '../models/ReportCompare';
import { ReportPeriod } from '../models/ReportPeriod';
import { ReportPeriodRef } from '../models/ReportPeriodRef';
import { ReportPeriodUnit } from '../models/ReportPeriodUnit';
import { ReportSpan } from '../types/ReportSpan';
import { addReportDays } from './addReportDays';
import { reportDaysBetween } from './reportDaysBetween';

// A period that starts on the first of a month and runs whole months is shifted in months, every other one in days.
const monthsLong = (ref: ReportPeriodRef): Nullable<number> => {
  switch (ref.period) {
    case ReportPeriod.ThisMonth:
    case ReportPeriod.LastMonth:
      return 1;
    case ReportPeriod.ThisQuarter:
      return 3;
    case ReportPeriod.ThisYear:
    case ReportPeriod.ThisFinancialYear:
    case ReportPeriod.LastFinancialYear:
      return 12;
    case ReportPeriod.Last:
      return ref.unit === ReportPeriodUnit.Month ? ref.count : null;
    default:
      return null;
  }
};

const isWeekAligned = (ref: ReportPeriodRef): boolean =>
  ref.period === ReportPeriod.ThisWeek ||
  ref.period === ReportPeriod.LastWeek ||
  (ref.period === ReportPeriod.Last && ref.unit === ReportPeriodUnit.Week);

/**
 * The whole earlier period a comparison counts, by the register's rules: the previous period is the run of the same
 * length just before (in months for a period of months, in days otherwise), the same day last week is seven days earlier,
 * and the same period last year is twelve months earlier (the day clamped), or 52 weeks for a period of Monday weeks.
 */
export const shiftReportPeriodDays = (ref: ReportPeriodRef, span: ReportSpan, compare: ReportCompare): ReportSpan => {
  const byDays = (offset: number): ReportSpan => ({ from: addReportDays(span.from, offset), to: addReportDays(span.to, offset), lastHour: null });
  // The day before the shifted first day of the period after it, so a month keeps its own last day.
  const byMonths = (offset: number): ReportSpan => ({
    from: addCalendarMonths(span.from, offset),
    to: addReportDays(addCalendarMonths(addReportDays(span.to, 1), offset), -1),
    lastHour: null,
  });
  const months = monthsLong(ref);

  switch (compare) {
    case ReportCompare.PreviousPeriod:
      return months !== null ? byMonths(-months) : byDays(-(reportDaysBetween(span.from, span.to) + 1));
    case ReportCompare.SameDayLastWeek:
      return byDays(-7);
    case ReportCompare.SamePeriodLastYear:
      if (isWeekAligned(ref)) {
        return byDays(-364);
      }
      return months !== null ? byMonths(-12) : { from: addCalendarMonths(span.from, -12), to: addCalendarMonths(span.to, -12), lastHour: null };
  }
};
