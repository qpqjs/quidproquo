import { describe, expect, it } from 'vitest';

import { ReportCompare } from '../models/ReportCompare';
import { ReportPeriod } from '../models/ReportPeriod';
import { ReportPeriodRef } from '../models/ReportPeriodRef';
import { ReportPeriodUnit } from '../models/ReportPeriodUnit';
import { shiftReportPeriodDays } from './shiftReportPeriodDays';

const shift = (ref: ReportPeriodRef, from: string, to: string, compare: ReportCompare) => {
  const earlier = shiftReportPeriodDays(ref, { from, to, lastHour: null }, compare);

  return [earlier.from, earlier.to];
};

describe('shiftReportPeriodDays', () => {
  it('shifts a period of months by whole months, so each month keeps its own last day', () => {
    expect(shift({ period: ReportPeriod.ThisMonth }, '2026-11-01', '2026-11-30', ReportCompare.PreviousPeriod)).toEqual(['2026-10-01', '2026-10-31']);
    expect(shift({ period: ReportPeriod.ThisQuarter }, '2026-10-01', '2026-12-31', ReportCompare.PreviousPeriod)).toEqual([
      '2026-07-01',
      '2026-09-30',
    ]);
    expect(
      shift({ period: ReportPeriod.Last, count: 3, unit: ReportPeriodUnit.Month }, '2026-09-01', '2026-11-30', ReportCompare.PreviousPeriod),
    ).toEqual(['2026-06-01', '2026-08-31']);
  });

  it('shifts any other period by its own length in days', () => {
    expect(shift({ period: ReportPeriod.Last7Days }, '2026-11-02', '2026-11-08', ReportCompare.PreviousPeriod)).toEqual(['2026-10-26', '2026-11-01']);
    expect(shift({ period: ReportPeriod.Yesterday }, '2026-11-07', '2026-11-07', ReportCompare.PreviousPeriod)).toEqual(['2026-11-06', '2026-11-06']);
    expect(
      shift({ period: ReportPeriod.Last, count: 10, unit: ReportPeriodUnit.Day }, '2026-10-30', '2026-11-08', ReportCompare.PreviousPeriod),
    ).toEqual(['2026-10-20', '2026-10-29']);
  });

  it('puts the same day last week seven days earlier', () => {
    expect(shift({ period: ReportPeriod.Yesterday }, '2026-11-07', '2026-11-07', ReportCompare.SameDayLastWeek)).toEqual([
      '2026-10-31',
      '2026-10-31',
    ]);
  });

  it('puts the same period last year twelve months earlier, the day clamped, and a period of Monday weeks 52 weeks earlier', () => {
    expect(shift({ period: ReportPeriod.ThisMonth }, '2026-11-01', '2026-11-30', ReportCompare.SamePeriodLastYear)).toEqual([
      '2025-11-01',
      '2025-11-30',
    ]);
    expect(shift({ period: ReportPeriod.Last7Days }, '2028-02-23', '2028-02-29', ReportCompare.SamePeriodLastYear)).toEqual([
      '2027-02-23',
      '2027-02-28',
    ]);
    expect(shift({ period: ReportPeriod.ThisWeek }, '2026-11-02', '2026-11-08', ReportCompare.SamePeriodLastYear)).toEqual([
      '2025-11-03',
      '2025-11-09',
    ]);
  });
});
