import { ReportCalendarPeriodRef } from './ReportCalendarPeriodRef';
import { ReportRollingPeriodRef } from './ReportRollingPeriodRef';

/** A view's period: a calendar period or a rolling window, told apart by `period`. */
export type ReportPeriodRef = ReportCalendarPeriodRef | ReportRollingPeriodRef;
