import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useMetadata } from './useMetadata';

describe('useMetadata', () => {
  it('returns undefined before anything is stored', () => {
    const { result } = renderHook(() => useMetadata<string>({}));

    expect(result.current[0]()).toBeUndefined();
  });

  it('stores and retrieves a value by key', () => {
    const key = {};
    const { result } = renderHook(() => useMetadata<number>(key));

    result.current[1](42);

    expect(result.current[0]()).toBe(42);
  });

  it('keeps separate values for separate keys', () => {
    const { result: a } = renderHook(() => useMetadata<string>({}));
    const { result: b } = renderHook(() => useMetadata<string>({}));

    a.current[1]('one');
    b.current[1]('two');

    expect(a.current[0]()).toBe('one');
    expect(b.current[0]()).toBe('two');
  });
});
