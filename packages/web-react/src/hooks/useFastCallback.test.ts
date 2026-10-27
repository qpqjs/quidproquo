import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useFastCallback } from './useFastCallback';

describe('useFastCallback', () => {
  it('returns a stable identity that calls the latest callback', () => {
    const { result, rerender } = renderHook(({ cb }) => useFastCallback(cb), {
      initialProps: { cb: (): string => 'a' },
    });

    const first = result.current;
    rerender({ cb: () => 'b' });

    expect(result.current).toBe(first);
    expect(result.current()).toBe('b');
  });
});
