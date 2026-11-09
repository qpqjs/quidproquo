import { ReportPeriod } from './ReportPeriod';
import { ReportPeriodUnit } from './ReportPeriodUnit';

/** `count` whole `unit`s ending with the current one: "last 26 weeks" is this week and the 25 before it. */
export type ReportRollingPeriodRef = {
  period: ReportPeriod.Last;
  count: number;
  unit: ReportPeriodUnit;
};
