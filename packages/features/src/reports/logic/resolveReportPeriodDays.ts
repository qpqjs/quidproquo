import { addCalendarMonths, getWeekdayFromMonday } from '@qpqjs/core';

import { ReportPeriod } from '../models/ReportPeriod';
import { ReportPeriodRef } from '../models/ReportPeriodRef';
import { ReportPeriodUnit } from '../models/ReportPeriodUnit';
import { ReportSpan } from '../types/ReportSpan';
import { addReportDays } from './addReportDays';

/**
 * The first and last local day (inclusive) of a period around `today`, by the register's rules: weeks start on Monday,
 * "last N days" end today and count it as one of the N, calendar periods run their whole length including days still to
 * come, and a rolling period is `count` whole units ending with the current one.
 */
export const resolveReportPeriodDays = (ref: ReportPeriodRef, today: string, financialYearStartMonth: number): ReportSpan => {
  const monthStart = `${today.slice(0, 7)}-01`;
  const monday = addReportDays(today, -getWeekdayFromMonday(today));
  const month = Number(today.slice(5, 7));
  const financialYearStart = addCalendarMonths(monthStart, -((month - financialYearStartMonth + 12) % 12));
  const days = (from: string, to: string): ReportSpan => ({ from, to, lastHour: null });
  const months = (first: string, length: number): ReportSpan => days(first, addReportDays(addCalendarMonths(first, length), -1));

  switch (ref.period) {
    case ReportPeriod.Today:
      return days(today, today);
    case ReportPeriod.Yesterday:
      return days(addReportDays(today, -1), addReportDays(today, -1));
    case ReportPeriod.ThisWeek:
      return days(monday, addReportDays(monday, 6));
    case ReportPeriod.LastWeek:
      return days(addReportDays(monday, -7), addReportDays(monday, -1));
    case ReportPeriod.ThisMonth:
      return months(monthStart, 1);
    case ReportPeriod.LastMonth:
      return months(addCalendarMonths(monthStart, -1), 1);
    case ReportPeriod.Last7Days:
      return days(addReportDays(today, -6), today);
    case ReportPeriod.Last30Days:
      return days(addReportDays(today, -29), today);
    case ReportPeriod.ThisQuarter:
      return months(addCalendarMonths(monthStart, -((month - 1) % 3)), 3);
    case ReportPeriod.ThisYear:
      return months(`${today.slice(0, 4)}-01-01`, 12);
    case ReportPeriod.ThisFinancialYear:
      return months(financialYearStart, 12);
    case ReportPeriod.LastFinancialYear:
      return months(addCalendarMonths(financialYearStart, -12), 12);
    case ReportPeriod.Last:
      switch (ref.unit) {
        case ReportPeriodUnit.Day:
          return days(addReportDays(today, 1 - ref.count), today);
        case ReportPeriodUnit.Week:
          return days(addReportDays(monday, -7 * (ref.count - 1)), addReportDays(monday, 6));
        case ReportPeriodUnit.Month:
          return months(addCalendarMonths(monthStart, 1 - ref.count), ref.count);
      }
  }
};
