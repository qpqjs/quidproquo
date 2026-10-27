import { describe, expect, it } from 'vitest';

import { addMillisecondsToTDateIso } from './addMillisecondsToTDateIso';

describe('addMillisecondsToTDateIso', () => {
  it('adds milliseconds and returns an ISO string', () => {
    expect(addMillisecondsToTDateIso('2024-01-01T00:00:00.000Z', 1500)).toBe('2024-01-01T00:00:01.500Z');
  });

  it('rolls over the second boundary', () => {
    expect(addMillisecondsToTDateIso('2024-01-01T00:00:59.500Z', 600)).toBe('2024-01-01T00:01:00.100Z');
  });

  it('subtracts with a negative count', () => {
    expect(addMillisecondsToTDateIso('2024-01-01T00:00:01.000Z', -1000)).toBe('2024-01-01T00:00:00.000Z');
  });
});
