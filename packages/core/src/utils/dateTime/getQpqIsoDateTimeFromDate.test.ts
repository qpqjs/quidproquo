import { describe, expect, it } from 'vitest';

import { getQpqIsoDateTimeFromDate } from './getQpqIsoDateTimeFromDate';
import { getValidQpqIsoDateTime } from './getValidQpqIsoDateTime';

describe('getQpqIsoDateTimeFromDate', () => {
  it('formats a date as a UTC ISO string with milliseconds', () => {
    expect(getQpqIsoDateTimeFromDate(new Date(Date.UTC(2024, 5, 1, 12, 34, 56, 789)))).toBe('2024-06-01T12:34:56.789Z');
  });

  it('produces a value that getValidQpqIsoDateTime accepts', () => {
    const value = getQpqIsoDateTimeFromDate(new Date());

    expect(getValidQpqIsoDateTime(value)).toBe(value);
  });

  it('throws on an invalid date', () => {
    expect(() => getQpqIsoDateTimeFromDate(new Date(NaN))).toThrow(RangeError);
  });
});
