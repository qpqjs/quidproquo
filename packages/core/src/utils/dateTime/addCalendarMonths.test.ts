import { describe, expect, it } from 'vitest';

import { addCalendarMonths } from './addCalendarMonths';

describe('addCalendarMonths', () => {
  it('keeps the day of the month across month and year ends', () => {
    expect(addCalendarMonths('2026-11-09', 1)).toBe('2026-12-09');
    expect(addCalendarMonths('2026-11-01', 2)).toBe('2027-01-01');
    expect(addCalendarMonths('2026-01-15', -1)).toBe('2025-12-15');
    expect(addCalendarMonths('2026-07-01', -12)).toBe('2025-07-01');
  });

  it('clamps to the last day of a shorter month instead of overflowing into the next', () => {
    expect(addCalendarMonths('2026-03-31', -1)).toBe('2026-02-28');
    expect(addCalendarMonths('2028-03-31', -1)).toBe('2028-02-29');
    expect(addCalendarMonths('2028-02-29', -12)).toBe('2027-02-28');
  });
});
