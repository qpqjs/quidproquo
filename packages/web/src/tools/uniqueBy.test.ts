import { describe, expect, it } from 'vitest';

import { uniqueBy } from './uniqueBy';

describe('uniqueBy', () => {
  it('returns an empty array unchanged', () => {
    expect(uniqueBy([], (item) => item)).toEqual([]);
  });

  it('keeps the first occurrence of each key', () => {
    expect(uniqueBy([1, 2, 2, 3, 1], (item) => item)).toEqual([1, 2, 3]);
  });

  it('dedupes objects by a derived key', () => {
    const items = [
      { id: 'a', n: 1 },
      { id: 'b', n: 2 },
      { id: 'a', n: 3 },
    ];

    expect(uniqueBy(items, (item) => item.id)).toEqual([
      { id: 'a', n: 1 },
      { id: 'b', n: 2 },
    ]);
  });

  it('treats every item as unique when keys never collide', () => {
    expect(uniqueBy([1, 2, 3], () => Math.random())).toHaveLength(3);
  });
});
