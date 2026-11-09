import { describe, expect, it } from 'vitest';

import { applyReportEvents } from '../fold/logic/applyReportEvents';
import { createInitialReportMonthDocument } from '../fold/logic/createInitialReportMonthDocument';
import { ReportBucket } from '../models/ReportBucket';
import { ReportCompare } from '../models/ReportCompare';
import { ReportMonthDocument } from '../models/ReportMonthDocument';
import { ReportPeriod } from '../models/ReportPeriod';
import { ReportPeriodUnit } from '../models/ReportPeriodUnit';
import { ReportStoredEvent } from '../models/ReportStoredEvent';
import { ReportViewDefinition } from '../models/ReportViewDefinition';
import { buildReportReadResult } from './buildReportReadResult';
import { planReportRead } from './planReportRead';
import { reportBucketKeys } from './reportBucketKeys';

// 15:12 on Monday 9 November 2026 at +10:00.
const NOW = '2026-11-09T05:12:40.118Z';
const LIMITS = { maxCellsPerBucket: 200, maxDimensionNames: 32, maxMeasureNames: 32 };

const rendered = (at: string, templateKind: string, outcome: string, pages?: number): ReportStoredEvent => ({
  type: 'documentRendered',
  at: at as ReportStoredEvent['at'],
  utcOffset: '+10:00',
  bucketKeys: reportBucketKeys(at as ReportStoredEvent['at'], 600),
  dimensions: { templateKind, outcome },
  measures: pages === undefined ? {} : { pages },
});

// Local times at +10:00 in the comments.
const NOVEMBER = [
  rendered('2026-11-03T00:10:00.000Z', 'docx', 'ok', 4), // 3rd 10:10
  rendered('2026-11-03T01:00:00.000Z', 'docx', 'failed'), // 3rd 11:00
  rendered('2026-11-03T02:00:00.000Z', 'pdf', 'ok', 1), // 3rd 12:00
  rendered('2026-11-08T03:30:00.000Z', 'docx', 'ok', 5), // 8th 13:30, yesterday
  rendered('2026-11-08T06:30:00.000Z', 'docx', 'ok'), // 8th 16:30, yesterday after the current hour
  rendered('2026-11-09T01:30:00.000Z', 'docx', 'ok', 2), // 9th 11:30, today
  rendered('2026-11-09T04:30:00.000Z', 'pdf', 'ok', 3), // 9th 14:30, today
];
const OCTOBER = [
  rendered('2026-10-05T00:00:00.000Z', 'docx', 'ok', 7), // 5th, inside "last month to the 9th"
  rendered('2026-10-20T00:00:00.000Z', 'xlsx', 'ok', 1), // 20th, after it
];

const month = (events: ReportStoredEvent[], limits = LIMITS): ReportMonthDocument =>
  applyReportEvents(createInitialReportMonthDocument(), events, limits);
const STATES = new Map([
  ['2026-10', month(OCTOBER)],
  ['2026-11', month(NOVEMBER)],
]);

const read = (view: ReportViewDefinition, states: ReadonlyMap<string, ReportMonthDocument> = STATES, retentionMonths?: number) => {
  const plan = planReportRead({ view, now: NOW, utcOffsetMinutes: 600, financialYearStartMonth: 7, retentionMonths });

  if ('problem' in plan) {
    throw new Error(plan.problem);
  }

  return buildReportReadResult({ view, now: NOW, utcOffset: '+10:00', utcOffsetMinutes: 600, plan, states });
};

const EMPTY = { count: 0, sums: {}, mins: {}, maxes: {} };

describe('buildReportReadResult', () => {
  it('answers renders by kind over the last 7 days, a point a day, every day drawn and every series in every point', () => {
    const result = read({ event: 'documentRendered', period: { period: ReportPeriod.Last7Days }, bucket: ReportBucket.Day, groupBy: 'templateKind' });

    expect(result.now).toBe(NOW);
    expect(result.period).toEqual({ period: ReportPeriod.Last7Days, utcOffset: '+10:00', from: '2026-11-03', to: '2026-11-09' });
    expect(result.bucket).toBe(ReportBucket.Day);
    expect(result.buckets!.map((bucket) => [bucket.key, bucket.count])).toEqual([
      ['2026-11-03', 3],
      ['2026-11-04', 0],
      ['2026-11-05', 0],
      ['2026-11-06', 0],
      ['2026-11-07', 0],
      ['2026-11-08', 2],
      ['2026-11-09', 2],
    ]);
    expect(result.buckets![0]).toEqual({
      key: '2026-11-03',
      count: 3,
      sums: { pages: 5 },
      mins: { pages: 1 },
      maxes: { pages: 4 },
      series: {
        docx: { count: 2, sums: { pages: 4 }, mins: { pages: 4 }, maxes: { pages: 4 } },
        pdf: { count: 1, sums: { pages: 1 }, mins: { pages: 1 }, maxes: { pages: 1 } },
      },
    });
    // An empty day has a count of 0 and no smallest or largest, rather than a minimum of 0.
    expect(result.buckets![1]).toEqual({ key: '2026-11-04', ...EMPTY, series: { docx: EMPTY, pdf: EMPTY } });
    expect([result.total, result.sums, result.mins, result.maxes]).toEqual([7, { pages: 15 }, { pages: 1 }, { pages: 5 }]);
    expect(result.groups!.map((group) => [group.value, group.count])).toEqual([
      ['docx', 5],
      ['pdf', 2],
    ]);
    expect(result.groupsTotal).toBeUndefined();
    expect(result.truncated).toBe(false);
    expect(result.dimensionKeys).toEqual(['outcome', 'templateKind']);
    expect(result.measureKeys).toEqual(['pages']);
    expect(result.comparison).toBeUndefined();
  });

  it('keys weeks by their Monday, the first holding only the 1st, and draws the weeks still to come', () => {
    const result = read({ event: 'documentRendered', period: { period: ReportPeriod.ThisMonth }, bucket: ReportBucket.Week });

    expect(result.buckets!.map((bucket) => [bucket.key, bucket.count])).toEqual([
      ['2026-10-26', 0],
      ['2026-11-02', 5],
      ['2026-11-09', 2],
      ['2026-11-16', 0],
      ['2026-11-23', 0],
      ['2026-11-30', 0],
    ]);
  });

  it('compares this month with last month to the same day, ranking groups by the measure and lining the comparison up with them', () => {
    const result = read({
      event: 'documentRendered',
      period: { period: ReportPeriod.ThisMonth },
      filter: { outcome: 'ok' },
      groupBy: 'templateKind',
      measure: 'pages',
      compare: ReportCompare.PreviousPeriod,
    });

    expect(result.buckets).toBeUndefined();
    expect([result.total, result.sums]).toEqual([6, { pages: 15 }]);
    expect(result.groups!.map((group) => [group.value, group.count, group.sums.pages])).toEqual([
      ['docx', 4, 11],
      ['pdf', 2, 4],
    ]);
    expect(result.comparison).toEqual({
      compare: ReportCompare.PreviousPeriod,
      period: { period: ReportPeriod.ThisMonth, utcOffset: '+10:00', from: '2026-10-01', to: '2026-10-09' },
      total: 1,
      sums: { pages: 7 },
      mins: { pages: 7 },
      maxes: { pages: 7 },
      groups: [
        { value: 'docx', count: 1, sums: { pages: 7 }, mins: { pages: 7 }, maxes: { pages: 7 } },
        { value: 'pdf', ...EMPTY },
      ],
    });
  });

  it('compares today with yesterday by the hour, yesterday counted through the end of the current hour', () => {
    const result = read({
      event: 'documentRendered',
      period: { period: ReportPeriod.Today },
      bucket: ReportBucket.Hour,
      compare: ReportCompare.PreviousPeriod,
    });

    expect(result.buckets).toHaveLength(24);
    expect(result.buckets!.filter((bucket) => bucket.count > 0).map((bucket) => bucket.key)).toEqual(['2026-11-09T11:00', '2026-11-09T14:00']);
    expect(result.comparison!.period).toMatchObject({ from: '2026-11-08', to: '2026-11-08', until: '2026-11-08T06:00:00.000Z' });
    expect(result.comparison!.buckets).toHaveLength(16);
    // 13:30 yesterday counts; 16:30 yesterday is after 15:59 and does not.
    expect(result.comparison!.total).toBe(1);
  });

  it('cuts groups to the limit, saying how many there were', () => {
    const result = read({ event: 'documentRendered', period: { period: ReportPeriod.ThisMonth }, groupBy: 'templateKind', groupLimit: 1 });

    expect(result.groups!.map((group) => group.value)).toEqual(['docx']);
    expect(result.groupsTotal).toBe(2);
  });

  it('flags a period an other cell touched, still counting those events in the unfiltered total but in no group', () => {
    // With one cell a day, each day's later tuples (every pdf render here) land in the other cell.
    const capped = new Map([['2026-11', month(NOVEMBER, { ...LIMITS, maxCellsPerBucket: 1 })]]);
    const result = read({ event: 'documentRendered', period: { period: ReportPeriod.ThisMonth }, groupBy: 'templateKind' }, capped);

    expect(result.truncated).toBe(true);
    expect(result.total).toBe(7);
    expect(result.groups!.map((group) => [group.value, group.count])).toEqual([['docx', 4]]);
  });

  it('reads a comparison reaching past retention as nothing, and says so', () => {
    const view: ReportViewDefinition = {
      event: 'documentRendered',
      period: { period: ReportPeriod.ThisMonth },
      compare: ReportCompare.SamePeriodLastYear,
    };
    const lastYear = new Map([...STATES, ['2025-11', month([rendered('2025-11-02T00:00:00.000Z', 'docx', 'ok')])]]);

    expect(read(view, lastYear, 6).comparison).toMatchObject({ total: 0, period: { from: '2025-11-01', to: '2025-11-09', beyondRetention: true } });
    expect(read(view, lastYear, 13).comparison).toMatchObject({ total: 1, period: { from: '2025-11-01', to: '2025-11-09' } });
    expect(read(view, lastYear, 13).comparison!.period.beyondRetention).toBeUndefined();
  });
});

describe('planReportRead', () => {
  it('refuses a period spanning more month documents than a read covers', () => {
    const plan = planReportRead({
      view: { event: 'documentRendered', period: { period: ReportPeriod.Last, count: 30, unit: ReportPeriodUnit.Month } },
      now: NOW,
      utcOffsetMinutes: 600,
      financialYearStartMonth: 7,
    });

    expect(plan).toEqual({ problem: 'the period spans 30 months; a read covers at most 24' });
  });
});
