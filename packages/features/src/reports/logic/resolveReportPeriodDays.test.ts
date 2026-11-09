import { describe, expect, it } from 'vitest';

import { ReportPeriod } from '../models/ReportPeriod';
import { ReportPeriodRef } from '../models/ReportPeriodRef';
import { ReportPeriodUnit } from '../models/ReportPeriodUnit';
import { resolveReportPeriodDays } from './resolveReportPeriodDays';

// Sunday 8 November 2026; that week's Monday is the 2nd.
const days = (ref: ReportPeriodRef, today = '2026-11-08', financialYearStartMonth = 7) => {
  const { from, to } = resolveReportPeriodDays(ref, today, financialYearStartMonth);

  return [from, to];
};

describe('resolveReportPeriodDays', () => {
  it("resolves the register's calendar periods around today", () => {
    expect(days({ period: ReportPeriod.Today })).toEqual(['2026-11-08', '2026-11-08']);
    expect(days({ period: ReportPeriod.Yesterday })).toEqual(['2026-11-07', '2026-11-07']);
    expect(days({ period: ReportPeriod.ThisWeek })).toEqual(['2026-11-02', '2026-11-08']);
    expect(days({ period: ReportPeriod.LastWeek })).toEqual(['2026-10-26', '2026-11-01']);
    expect(days({ period: ReportPeriod.ThisMonth })).toEqual(['2026-11-01', '2026-11-30']);
    expect(days({ period: ReportPeriod.LastMonth })).toEqual(['2026-10-01', '2026-10-31']);
    expect(days({ period: ReportPeriod.ThisQuarter })).toEqual(['2026-10-01', '2026-12-31']);
    expect(days({ period: ReportPeriod.ThisYear })).toEqual(['2026-01-01', '2026-12-31']);
  });

  it('counts today as the last of the last N days: last 7 days on the 8th is the 2nd to the 8th', () => {
    expect(days({ period: ReportPeriod.Last7Days })).toEqual(['2026-11-02', '2026-11-08']);
    expect(days({ period: ReportPeriod.Last30Days })).toEqual(['2026-10-10', '2026-11-08']);
  });

  it('counts a rolling period in whole units ending with the current one', () => {
    expect(days({ period: ReportPeriod.Last, count: 10, unit: ReportPeriodUnit.Day })).toEqual(['2026-10-30', '2026-11-08']);
    expect(days({ period: ReportPeriod.Last, count: 26, unit: ReportPeriodUnit.Week })).toEqual(['2026-05-11', '2026-11-08']);
    expect(days({ period: ReportPeriod.Last, count: 3, unit: ReportPeriodUnit.Month })).toEqual(['2026-09-01', '2026-11-30']);
  });

  it('starts the financial year on its month: the year ending on 30 June, the one starting on 1 July', () => {
    expect(days({ period: ReportPeriod.ThisFinancialYear })).toEqual(['2026-07-01', '2027-06-30']);
    expect(days({ period: ReportPeriod.LastFinancialYear })).toEqual(['2025-07-01', '2026-06-30']);
    expect(days({ period: ReportPeriod.ThisFinancialYear }, '2026-06-30')).toEqual(['2025-07-01', '2026-06-30']);
    expect(days({ period: ReportPeriod.ThisFinancialYear }, '2026-07-01')).toEqual(['2026-07-01', '2027-06-30']);
    expect(days({ period: ReportPeriod.ThisFinancialYear }, '2026-11-08', 1)).toEqual(['2026-01-01', '2026-12-31']);
  });

  it('crosses a year end', () => {
    expect(days({ period: ReportPeriod.LastMonth }, '2027-01-03')).toEqual(['2026-12-01', '2026-12-31']);
    expect(days({ period: ReportPeriod.ThisQuarter }, '2027-01-03')).toEqual(['2027-01-01', '2027-03-31']);
  });
});
