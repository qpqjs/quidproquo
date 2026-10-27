import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useZipArrays } from './useZipArrays';

describe('useZipArrays', () => {
  it('zips the two arrays into pairs', () => {
    const { result } = renderHook(() => useZipArrays([1, 2], ['a', 'b']));

    expect(result.current).toEqual([
      [1, 'a'],
      [2, 'b'],
    ]);
  });

  it('memoizes the result until an input changes', () => {
    const left = [1];
    const right = ['a'];
    const { result, rerender } = renderHook(({ l, r }) => useZipArrays(l, r), {
      initialProps: { l: left, r: right },
    });

    const first = result.current;
    rerender({ l: left, r: right });

    expect(result.current).toBe(first);
  });
});
