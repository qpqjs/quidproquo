import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useEffectCallback } from './useEffectCallback';

describe('useEffectCallback', () => {
  it('returns a stable function identity across renders', () => {
    const { result, rerender } = renderHook(({ cb }) => useEffectCallback(cb), {
      initialProps: { cb: (): string => 'a' },
    });

    const first = result.current;
    rerender({ cb: () => 'b' });

    expect(result.current).toBe(first);
  });

  it('calls the latest callback when deps are omitted', () => {
    const { result, rerender } = renderHook(({ cb }) => useEffectCallback(cb), {
      initialProps: { cb: (): string => 'a' },
    });

    rerender({ cb: () => 'b' });

    expect(result.current()).toBe('b');
  });

  it('keeps the original callback when deps are empty', () => {
    const { result, rerender } = renderHook(({ cb }) => useEffectCallback(cb, []), {
      initialProps: { cb: (): string => 'a' },
    });

    rerender({ cb: () => 'b' });

    expect(result.current()).toBe('a');
  });

  it('updates the callback only when a dep changes', () => {
    const { result, rerender } = renderHook(({ cb, dep }) => useEffectCallback(cb, [dep]), {
      initialProps: { cb: (): string => 'a', dep: 1 },
    });

    rerender({ cb: () => 'b', dep: 1 });
    expect(result.current()).toBe('a');

    rerender({ cb: () => 'c', dep: 2 });
    expect(result.current()).toBe('c');
  });

  it('forwards arguments to the callback', () => {
    const { result } = renderHook(() => useEffectCallback((a: number, b: number) => a + b));

    expect(result.current(2, 3)).toBe(5);
  });
});
