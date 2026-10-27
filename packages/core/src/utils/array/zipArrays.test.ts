import { describe, expect, it } from 'vitest';

import { zipArrays } from './zipArrays';

describe('zipArrays', () => {
  it('pairs elements at matching indexes', () => {
    expect(zipArrays([1, 2, 3], ['a', 'b', 'c'])).toEqual([
      [1, 'a'],
      [2, 'b'],
      [3, 'c'],
    ]);
  });

  it('pads the shorter array with undefined', () => {
    expect(zipArrays([1, 2], ['a'])).toEqual([
      [1, 'a'],
      [2, undefined],
    ]);
  });

  it('returns an empty array when both inputs are empty', () => {
    expect(zipArrays([], [])).toEqual([]);
  });
});
