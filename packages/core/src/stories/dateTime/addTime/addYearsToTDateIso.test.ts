import { describe, expect, it } from 'vitest';

import { addYearsToTDateIso } from './addYearsToTDateIso';

describe('addYearsToTDateIso', () => {
  it('adds years and returns an ISO string', () => {
    expect(addYearsToTDateIso('2024-01-01T00:00:00.000Z', 2)).toBe('2026-01-01T00:00:00.000Z');
  });

  it('subtracts with a negative count', () => {
    expect(addYearsToTDateIso('2024-01-01T00:00:00.000Z', -1)).toBe('2023-01-01T00:00:00.000Z');
  });
});
