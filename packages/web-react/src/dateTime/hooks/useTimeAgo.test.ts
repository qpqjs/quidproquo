import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useTimeAgo } from './useTimeAgo';

describe('useTimeAgo', () => {
  beforeEach(() => vi.useFakeTimers().setSystemTime(new Date('2026-06-26T12:00:00.000Z')));
  afterEach(() => vi.useRealTimers());

  it('returns a relative phrase for the date', () => {
    const date = new Date('2026-06-26T11:55:00.000Z');
    const { result } = renderHook(() => useTimeAgo(date, 'en'));

    expect(result.current).toBe('5 minutes ago');
  });

  it('re-renders as time advances', () => {
    const date = new Date('2026-06-26T11:59:30.000Z');
    const { result } = renderHook(() => useTimeAgo(date, 'en'));

    expect(result.current).toBe('30 seconds ago');

    act(() => vi.advanceTimersByTime(30 * 1000));

    expect(result.current).toBe('1 minute ago');
  });
});
