import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useLoadingManager } from './useLoadingManager';

describe('useLoadingManager', () => {
  it('starts not loading', () => {
    const { result } = renderHook(() => useLoadingManager());

    expect(result.current[0]).toBe(false);
  });

  it('is loading while at least one load is outstanding', () => {
    const { result } = renderHook(() => useLoadingManager());

    act(() => result.current[1].addLoading());
    expect(result.current[0]).toBe(true);

    act(() => result.current[1].addLoading());
    act(() => result.current[1].removeLoading());
    expect(result.current[0]).toBe(true);

    act(() => result.current[1].removeLoading());
    expect(result.current[0]).toBe(false);
  });
});
