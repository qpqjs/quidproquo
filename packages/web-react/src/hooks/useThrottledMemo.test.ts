import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useThrottledMemo } from './useThrottledMemo';

describe('useThrottledMemo', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns the initial factory value immediately', () => {
    const { result } = renderHook(({ value }) => useThrottledMemo(() => value, [value], 1), {
      initialProps: { value: 'a' },
    });

    expect(result.current).toBe('a');
  });

  it('delays updates until the throttle window elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useThrottledMemo(() => value, [value], 1), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    expect(result.current).toBe('a');

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe('b');
  });

  it('only applies the last value when updates arrive within the window', () => {
    const { result, rerender } = renderHook(({ value }) => useThrottledMemo(() => value, [value], 1), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    rerender({ value: 'c' });

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe('c');
  });
});
