import { describe, expect, it } from 'vitest';

import { ReportBucket } from '../models/ReportBucket';
import { ReportCompare } from '../models/ReportCompare';
import { ReportPeriod } from '../models/ReportPeriod';
import { ReportPeriodUnit } from '../models/ReportPeriodUnit';
import { reportViewProblem } from './reportViewProblem';

const view = (overrides: Record<string, unknown>): Record<string, unknown> => ({
  event: 'documentRendered',
  period: { period: ReportPeriod.ThisMonth },
  ...overrides,
});

describe('reportViewProblem', () => {
  it('accepts every field the plan declares', () => {
    expect(
      reportViewProblem(
        view({
          bucket: ReportBucket.Week,
          groupBy: 'templateKind',
          filter: { outcome: 'ok', pages: 4, signed: true },
          measure: 'pages',
          compare: ReportCompare.SamePeriodLastYear,
          groupLimit: 5,
        }),
      ),
    ).toBeNull();
    expect(reportViewProblem(view({ period: { period: ReportPeriod.Last, count: 26, unit: ReportPeriodUnit.Week } }))).toBeNull();
    expect(
      reportViewProblem(view({ period: { period: ReportPeriod.Today }, bucket: ReportBucket.Hour, compare: ReportCompare.PreviousPeriod })),
    ).toBeNull();
  });

  it('refuses a misspelt field, a missing event and a period that is not one', () => {
    expect(reportViewProblem(view({ window: 'last7Days' }))).toContain("unknown key 'window'");
    expect(reportViewProblem(view({ event: '' }))).toContain('event');
    expect(reportViewProblem(view({ period: { period: 'last90Days' } }))).toContain('period must be');
    expect(reportViewProblem(view({ period: ReportPeriod.Today }))).toContain('period must be');
  });

  it('wants a whole count and a unit on a rolling period, and neither on any other', () => {
    expect(reportViewProblem(view({ period: { period: ReportPeriod.Last, unit: ReportPeriodUnit.Day } }))).toContain('whole count');
    expect(reportViewProblem(view({ period: { period: ReportPeriod.Last, count: 2.5, unit: ReportPeriodUnit.Day } }))).toContain('whole count');
    expect(reportViewProblem(view({ period: { period: ReportPeriod.Last, count: 3 } }))).toContain('unit');
    expect(reportViewProblem(view({ period: { period: ReportPeriod.ThisMonth, count: 3 } }))).toContain("unknown key 'count'");
  });

  it('refuses buckets, comparisons, filters and limits outside their sets', () => {
    expect(reportViewProblem(view({ bucket: 'fortnight' }))).toContain('bucket');
    expect(reportViewProblem(view({ compare: 'lastDecade' }))).toContain('compare');
    expect(reportViewProblem(view({ filter: { outcome: ['ok'] } }))).toContain("'outcome'");
    expect(reportViewProblem(view({ filter: { pages: Number.NaN } }))).toContain("'pages'");
    expect(reportViewProblem(view({ groupLimit: 0 }))).toContain('groupLimit');
  });

  it('only reads by the hour what the hourly cells hold', () => {
    expect(reportViewProblem(view({ bucket: ReportBucket.Hour }))).toContain('today or yesterday');
    expect(reportViewProblem(view({ period: { period: ReportPeriod.Yesterday }, bucket: ReportBucket.Hour }))).toBeNull();
    expect(
      reportViewProblem(view({ period: { period: ReportPeriod.Yesterday }, bucket: ReportBucket.Hour, compare: ReportCompare.PreviousPeriod })),
    ).toContain('hourly comparison');
  });

  it('only compares today with yesterday', () => {
    expect(reportViewProblem(view({ period: { period: ReportPeriod.Today }, compare: ReportCompare.SameDayLastWeek }))).toContain('today can only');
    expect(reportViewProblem(view({ period: { period: ReportPeriod.Today }, compare: ReportCompare.SamePeriodLastYear }))).toContain(
      'today can only',
    );
    expect(reportViewProblem(view({ period: { period: ReportPeriod.Today }, compare: ReportCompare.PreviousPeriod }))).toBeNull();
  });
});
