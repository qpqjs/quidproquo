import { describe, expect, it, vi } from 'vitest';

import { memoFunc } from './memoFunc';

describe('memoFunc', () => {
  it('returns the cached value without re-invoking for the same args', () => {
    const spy = vi.fn((a: number, b: number) => ({ sum: a + b }));
    const memoized = memoFunc(spy);

    const first = memoized(1, 2);
    const second = memoized(1, 2);

    expect(first).toEqual({ sum: 3 });
    expect(second).toEqual(first);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('re-invokes for different args', () => {
    const spy = vi.fn((n: number) => ({ n }));
    const memoized = memoFunc(spy);

    memoized(1);
    memoized(2);

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('keeps a separate cache per wrapped function', () => {
    const a = memoFunc(vi.fn(() => ({ id: 'a' })));
    const b = memoFunc(vi.fn(() => ({ id: 'b' })));

    expect(a()).toEqual({ id: 'a' });
    expect(b()).toEqual({ id: 'b' });
  });

  it('re-invokes when the previous result was falsy (truthy-only cache)', () => {
    const spy = vi.fn(() => 0);
    const memoized = memoFunc(spy);

    memoized();
    memoized();

    expect(spy).toHaveBeenCalledTimes(2);
  });
});
