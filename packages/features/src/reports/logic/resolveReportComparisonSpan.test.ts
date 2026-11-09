import { describe, expect, it } from 'vitest';

import { ReportCompare } from '../models/ReportCompare';
import { ReportPeriod } from '../models/ReportPeriod';
import { resolveReportComparisonSpan } from './resolveReportComparisonSpan';

describe('resolveReportComparisonSpan', () => {
  it('compares a period in progress to the same day of the earlier one: this month to the 9th against last month to the 9th', () => {
    const own = { from: '2026-11-01', to: '2026-11-30', lastHour: null };

    expect(resolveReportComparisonSpan({ period: ReportPeriod.ThisMonth }, own, '2026-11-09', 15, ReportCompare.PreviousPeriod)).toEqual({
      from: '2026-10-01',
      to: '2026-10-09',
      lastHour: null,
    });
    expect(resolveReportComparisonSpan({ period: ReportPeriod.ThisMonth }, own, '2026-11-09', 15, ReportCompare.SamePeriodLastYear)).toEqual({
      from: '2025-11-01',
      to: '2025-11-09',
      lastHour: null,
    });
  });

  it('counts an earlier period too short to reach the same day whole: 31 March against all of February', () => {
    const own = { from: '2026-03-01', to: '2026-03-31', lastHour: null };

    expect(resolveReportComparisonSpan({ period: ReportPeriod.ThisMonth }, own, '2026-03-31', 9, ReportCompare.PreviousPeriod)).toEqual({
      from: '2026-02-01',
      to: '2026-02-28',
      lastHour: null,
    });
  });

  it('counts the whole earlier period when the period itself is over', () => {
    const own = { from: '2026-10-01', to: '2026-10-31', lastHour: null };

    expect(resolveReportComparisonSpan({ period: ReportPeriod.LastMonth }, own, '2026-11-09', 15, ReportCompare.PreviousPeriod)).toEqual({
      from: '2026-09-01',
      to: '2026-09-30',
      lastHour: null,
    });
  });

  it('cuts today against yesterday at the current hour, and a week in progress at the same weekday', () => {
    expect(
      resolveReportComparisonSpan(
        { period: ReportPeriod.Today },
        { from: '2026-11-09', to: '2026-11-09', lastHour: null },
        '2026-11-09',
        14,
        ReportCompare.PreviousPeriod,
      ),
    ).toEqual({ from: '2026-11-08', to: '2026-11-08', lastHour: 14 });
    expect(
      resolveReportComparisonSpan(
        { period: ReportPeriod.ThisWeek },
        { from: '2026-11-09', to: '2026-11-15', lastHour: null },
        '2026-11-11',
        14,
        ReportCompare.SameDayLastWeek,
      ),
    ).toEqual({ from: '2026-11-02', to: '2026-11-04', lastHour: null });
  });
});
