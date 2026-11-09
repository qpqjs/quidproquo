import { addDaysToTDateIso } from '@qpqjs/core';

import { REPORT_HOURLY_DAYS_KEPT } from '../../constants/reportHourlyDaysKept';
import { ReportMonthDocument } from '../../models/ReportMonthDocument';

/**
 * The document with only the hourly cells of the newest event's local day and the days before it that are kept.
 * Counted from the newest event's stamped day, never the clock, so a refold of the same log keeps the same hours.
 */
export const trimReportHourly = (state: ReportMonthDocument): ReportMonthDocument => {
  if (!state.newestDay) {
    return state;
  }

  // A plain day parses as UTC midnight, so this is calendar arithmetic; the slice drops the time.
  const firstDayKept = addDaysToTDateIso(state.newestDay, 1 - REPORT_HOURLY_DAYS_KEPT).slice(0, 10);

  return {
    ...state,
    hourly: Object.fromEntries(Object.entries(state.hourly).filter(([hourKey]) => hourKey.slice(0, 10) >= firstDayKept)),
  };
};
