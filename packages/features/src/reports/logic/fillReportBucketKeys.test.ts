import { Nullable } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { ReportBucket } from '../models/ReportBucket';
import { fillReportBucketKeys } from './fillReportBucketKeys';
import { reportReadBucketKey } from './reportReadBucketKey';

const span = (from: string, to: string, lastHour: Nullable<number> = null) => ({ from, to, lastHour });

describe('reportReadBucketKey', () => {
  it("keys a day's week by its Monday, its month and quarter by their first day, as the register does", () => {
    expect(reportReadBucketKey('2026-11-01', ReportBucket.Week)).toBe('2026-10-26');
    expect(reportReadBucketKey('2026-11-15', ReportBucket.Week)).toBe('2026-11-09');
    expect(reportReadBucketKey('2026-11-15', ReportBucket.Month)).toBe('2026-11-01');
    expect(reportReadBucketKey('2026-12-31', ReportBucket.Quarter)).toBe('2026-10-01');
    expect(reportReadBucketKey('2026-03-31', ReportBucket.Quarter)).toBe('2026-01-01');
  });
});

describe('fillReportBucketKeys', () => {
  it("draws every bucket of the span, a week at either end keyed by its Monday though it holds only the span's days", () => {
    expect(fillReportBucketKeys(span('2026-11-01', '2026-11-30'), ReportBucket.Week)).toEqual([
      '2026-10-26',
      '2026-11-02',
      '2026-11-09',
      '2026-11-16',
      '2026-11-23',
      '2026-11-30',
    ]);
    expect(fillReportBucketKeys(span('2026-10-01', '2026-12-31'), ReportBucket.Month)).toEqual(['2026-10-01', '2026-11-01', '2026-12-01']);
    expect(fillReportBucketKeys(span('2026-01-01', '2026-12-31'), ReportBucket.Quarter)).toEqual([
      '2026-01-01',
      '2026-04-01',
      '2026-07-01',
      '2026-10-01',
    ]);
    expect(fillReportBucketKeys(span('2026-11-02', '2026-11-08'), ReportBucket.Day)).toHaveLength(7);
  });

  it("draws a day's 24 hours, or its hours through the last one counted", () => {
    expect(fillReportBucketKeys(span('2026-11-09', '2026-11-09'), ReportBucket.Hour)).toHaveLength(24);
    expect(fillReportBucketKeys(span('2026-11-08', '2026-11-08', 2), ReportBucket.Hour)).toEqual([
      '2026-11-08T00:00',
      '2026-11-08T01:00',
      '2026-11-08T02:00',
    ]);
  });
});
