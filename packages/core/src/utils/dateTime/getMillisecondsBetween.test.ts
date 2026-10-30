import { describe, expect, it } from 'vitest';

import { getMillisecondsBetween } from './getMillisecondsBetween';

describe('getMillisecondsBetween', () => {
  it('measures the gap from start to end', () => {
    expect(getMillisecondsBetween('2026-06-26T00:00:00.000Z', '2026-06-26T00:00:01.500Z')).toBe(1500);
  });

  it('is negative when the end is earlier', () => {
    expect(getMillisecondsBetween('2026-06-26T00:00:01.000Z', '2026-06-26T00:00:00.000Z')).toBe(-1000);
  });
});
