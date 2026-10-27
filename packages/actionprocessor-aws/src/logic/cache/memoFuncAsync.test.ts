import { describe, expect, it, vi } from 'vitest';

import { memoFuncAsync } from './memoFuncAsync';

describe('memoFuncAsync', () => {
  it('awaits and caches the result, invoking the source once for the same args', async () => {
    const spy = vi.fn(async (n: number) => n * 2);
    const memoized = memoFuncAsync(spy);

    const first = await memoized(21);
    const second = await memoized(21);

    expect(first).toBe(42);
    expect(second).toBe(42);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('caches falsy resolved values', async () => {
    const spy = vi.fn(async () => 0);
    const memoized = memoFuncAsync(spy);

    await memoized();
    await memoized();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('re-invokes for different args', async () => {
    const spy = vi.fn(async (n: number) => n);
    const memoized = memoFuncAsync(spy);

    await memoized(1);
    await memoized(2);

    expect(spy).toHaveBeenCalledTimes(2);
  });
});
