import { afterEach, describe, expect, it } from 'vitest';

import { addDaysToTDateIso } from './addDaysToTDateIso';
import { addMonthsToTDateIso } from './addMonthsToTDateIso';

const originalTz = process.env.TZ;

afterEach(() => {
  process.env.TZ = originalTz;
});

describe('addDaysToTDateIso', () => {
  it('adds days and returns an ISO string', () => {
    expect(addDaysToTDateIso('2024-01-01T00:00:00.000Z', 5)).toBe('2024-01-06T00:00:00.000Z');
  });

  it('rolls over the month boundary', () => {
    expect(addDaysToTDateIso('2024-01-30T00:00:00.000Z', 3)).toBe('2024-02-02T00:00:00.000Z');
  });

  it('subtracts with a negative count', () => {
    expect(addDaysToTDateIso('2024-01-01T00:00:00.000Z', -1)).toBe('2023-12-31T00:00:00.000Z');
  });

  it('is unaffected by the local timezone crossing a DST boundary', () => {
    // 2024-03-10 is the US spring-forward date; local-time setters would shift the result by an hour
    process.env.TZ = 'America/New_York';

    expect(addDaysToTDateIso('2024-03-10T12:00:00.000Z', -1)).toBe('2024-03-09T12:00:00.000Z');
  });
});

describe('addMonthsToTDateIso', () => {
  it('adds months and rolls over the year', () => {
    expect(addMonthsToTDateIso('2024-11-15T00:00:00.000Z', 2)).toBe('2025-01-15T00:00:00.000Z');
  });

  it('overflows into the next month when the day does not exist (JS Date semantics)', () => {
    expect(addMonthsToTDateIso('2024-01-31T00:00:00.000Z', 1)).toBe('2024-03-02T00:00:00.000Z');
  });

  it('is unaffected by the local timezone crossing a DST boundary', () => {
    process.env.TZ = 'America/New_York';

    expect(addMonthsToTDateIso('2024-03-15T12:00:00.000Z', -1)).toBe('2024-02-15T12:00:00.000Z');
  });
});
