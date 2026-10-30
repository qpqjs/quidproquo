import { describe, expect, it } from 'vitest';

import { unique } from './unique';

describe('unique', () => {
  it('keeps the first of each value in order', () => {
    expect(unique(['b', 'a', 'b', 'c', 'a'])).toEqual(['b', 'a', 'c']);
  });

  it('leaves an array without duplicates as is', () => {
    expect(unique([1, 2, 3])).toEqual([1, 2, 3]);
  });
});
