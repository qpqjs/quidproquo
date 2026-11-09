import { ReportPeriod } from './ReportPeriod';

/** A period that carries its own length (today, this month, the financial year). */
export type ReportCalendarPeriodRef = {
  period: Exclude<ReportPeriod, ReportPeriod.Last>;
};
