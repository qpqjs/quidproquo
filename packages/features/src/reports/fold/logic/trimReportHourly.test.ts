import { describe, expect, it } from 'vitest';

import { ReportMonthDocument } from '../../models/ReportMonthDocument';
import { createInitialReportMonthDocument } from './createInitialReportMonthDocument';
import { trimReportHourly } from './trimReportHourly';

const cell = { '': { count: 1, sums: {}, mins: {}, maxes: {} } };

const withHours = (newestDay: string, hourKeys: string[]): ReportMonthDocument => ({
  ...createInitialReportMonthDocument(),
  newestAt: '2026-11-09T00:00:00.000Z',
  newestDay,
  hourly: Object.fromEntries(hourKeys.map((hourKey) => [hourKey, cell])),
});

describe('trimReportHourly', () => {
  it("keeps the hourly cells of the newest event's stamped day and the day before", () => {
    const state = withHours('2026-11-09', ['2026-11-07T23:00', '2026-11-08T00:00', '2026-11-09T00:00']);

    expect(Object.keys(trimReportHourly(state).hourly).sort()).toEqual(['2026-11-08T00:00', '2026-11-09T00:00']);
  });

  it('counts the day before across a month end', () => {
    const state = withHours('2026-11-01', ['2026-10-30T23:00', '2026-10-31T23:00', '2026-11-01T00:00']);

    expect(Object.keys(trimReportHourly(state).hourly).sort()).toEqual(['2026-10-31T23:00', '2026-11-01T00:00']);
  });

  it('leaves a document nothing has been counted in alone', () => {
    const state = createInitialReportMonthDocument();

    expect(trimReportHourly(state)).toBe(state);
  });
});
