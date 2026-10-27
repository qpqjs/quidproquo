import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';

import { SearchParams } from '../types';
import { useErrorsOverTime } from './useErrorsOverTime';

const searchParams = { startIsoDateTime: '2026-01-01T00:00:00Z', endIsoDateTime: '2026-01-01T10:00:00Z' } as SearchParams;

describe('useErrorsOverTime', () => {
  it('buckets errors into ten time slots', () => {
    const logs = [
      { startedAt: '2026-01-01T00:30:00Z', error: 'boom' },
      { startedAt: '2026-01-01T00:30:00Z', error: undefined },
    ];

    const { result } = renderHook(() => useErrorsOverTime(logs, searchParams));

    expect(result.current).toHaveLength(10);
    expect(result.current[0].errors).toBe(1);
    expect(result.current.reduce((sum, b) => sum + b.errors, 0)).toBe(1);
  });
});
