import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useRunEvery } from './useRunEvery';

describe('useRunEvery', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns the initial value from the function', () => {
    const { result } = renderHook(() => useRunEvery(() => 'first', 1));

    expect(result.current).toBe('first');
  });

  it('re-runs the function on each interval', () => {
    let count = 0;
    const { result } = renderHook(() => useRunEvery(() => ++count, 1));

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(2);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(3);
  });

  it('clears the interval on unmount', () => {
    const clearSpy = vi.spyOn(window, 'clearInterval');
    const { unmount } = renderHook(() => useRunEvery(() => 1, 1));

    unmount();

    expect(clearSpy).toHaveBeenCalled();
  });
});
