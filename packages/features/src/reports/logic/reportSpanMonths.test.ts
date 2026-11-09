import { describe, expect, it } from 'vitest';

import { reportSpanMonthCount } from './reportSpanMonthCount';
import { reportSpanMonths } from './reportSpanMonths';

describe('reportSpanMonths', () => {
  it('lists the local months a span touches, across a year end', () => {
    expect(reportSpanMonths('2026-11-02', '2026-11-08')).toEqual(['2026-11']);
    expect(reportSpanMonths('2026-10-30', '2026-11-08')).toEqual(['2026-10', '2026-11']);
    expect(reportSpanMonths('2026-12-15', '2027-02-01')).toEqual(['2026-12', '2027-01', '2027-02']);
  });

  it('counts them without listing them, so an overlong span is cheap to refuse', () => {
    expect(reportSpanMonthCount('2025-07-01', '2027-06-30')).toBe(24);
    expect(reportSpanMonthCount('0001-01-01', '9999-12-31')).toBe(119988);
  });
});
