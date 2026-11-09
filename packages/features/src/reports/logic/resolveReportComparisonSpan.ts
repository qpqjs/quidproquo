import { ReportCompare } from '../models/ReportCompare';
import { ReportPeriod } from '../models/ReportPeriod';
import { ReportPeriodRef } from '../models/ReportPeriodRef';
import { ReportSpan } from '../types/ReportSpan';
import { addReportDays } from './addReportDays';
import { reportDaysBetween } from './reportDaysBetween';
import { shiftReportPeriodDays } from './shiftReportPeriodDays';

/**
 * The span a comparison counts. A period still in progress is compared to the same point: as many days into the earlier
 * period as today is into this one, today counted whole, and today against yesterday to the end of the current hour (from
 * the hourly cells). An earlier period too short to reach that point (31 March against February) is counted whole.
 */
export const resolveReportComparisonSpan = (
  ref: ReportPeriodRef,
  own: ReportSpan,
  today: string,
  nowHour: number,
  compare: ReportCompare,
): ReportSpan => {
  const earlier = shiftReportPeriodDays(ref, own, compare);
  const inProgress = own.from <= today && today <= own.to;
  const cutDay = addReportDays(earlier.from, reportDaysBetween(own.from, today));

  if (!inProgress || cutDay > earlier.to) {
    return earlier;
  }

  const byHour = ref.period === ReportPeriod.Today && compare === ReportCompare.PreviousPeriod;

  return { from: earlier.from, to: cutDay, lastHour: byHour ? nowHour : null };
};
