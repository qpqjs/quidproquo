import { describe, expect, it } from 'vitest';

import { getIsLoadingFromLoadingCount } from './getIsLoadingFromLoadingCount';

describe('getIsLoadingFromLoadingCount', () => {
  it.each([
    [1, true],
    [5, true],
    [0, false],
    [-1, false],
  ])('returns %s > 0 as %s', (count: number, expected: boolean) => {
    expect(getIsLoadingFromLoadingCount(count)).toBe(expected);
  });
});
