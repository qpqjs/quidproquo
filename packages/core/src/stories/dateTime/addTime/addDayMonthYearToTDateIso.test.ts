import { describe, expect, it } from 'vitest';

import { addDayMonthYearToTDateIso } from './addDayMonthYearToTDateIso';

describe('addDayMonthYearToTDateIso', () => {
  it('adds days, months, and years together', () => {
    expect(addDayMonthYearToTDateIso('2024-01-15T00:00:00.000Z', 5, 2, 1)).toBe('2025-03-20T00:00:00.000Z');
  });

  it('returns the same instant when all offsets are zero', () => {
    expect(addDayMonthYearToTDateIso('2024-01-15T00:00:00.000Z', 0, 0, 0)).toBe('2024-01-15T00:00:00.000Z');
  });

  it('supports negative offsets', () => {
    expect(addDayMonthYearToTDateIso('2024-03-20T00:00:00.000Z', -5, -2, -1)).toBe('2023-01-15T00:00:00.000Z');
  });
});
