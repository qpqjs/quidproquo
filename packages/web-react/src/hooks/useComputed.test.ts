import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useComputed } from './useComputed';

describe('useComputed', () => {
  it('returns the selected slice of state', () => {
    const { result } = renderHook(() => useComputed({ a: 1, b: 2 }, (s) => s.b));

    expect(result.current).toBe(2);
  });

  it('recomputes when the selector output changes', () => {
    const { result, rerender } = renderHook(({ state }) => useComputed(state, (s) => s.value), {
      initialProps: { state: { value: 'first' } },
    });

    expect(result.current).toBe('first');

    rerender({ state: { value: 'second' } });

    expect(result.current).toBe('second');
  });
});
