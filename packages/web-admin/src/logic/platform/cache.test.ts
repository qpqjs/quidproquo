import { describe, expect, it, vi } from 'vitest';

import { cache } from './cache';

describe('cache', () => {
  it('returns the wrapped result on first call', () => {
    const cached = cache((a: number, b: number) => a + b);

    expect(cached(1, 2)).toBe(3);
  });

  it('memoizes by serialized arguments', () => {
    const spy = vi.fn((value: number) => value * 2);
    const cached = cache(spy);

    expect(cached(2)).toBe(4);
    expect(cached(2)).toBe(4);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('computes a fresh result for different arguments', () => {
    const spy = vi.fn((value: number) => value * 2);
    const cached = cache(spy);

    expect(cached(2)).toBe(4);
    expect(cached(3)).toBe(6);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
