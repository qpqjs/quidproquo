import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';

import { SearchParams } from '../types';
import { useRequestsByService } from './useRequestsByService';

const searchParams = { startIsoDateTime: '2026-01-01T00:00:00Z', endIsoDateTime: '2026-01-01T10:00:00Z' } as SearchParams;

describe('useRequestsByService', () => {
  it('counts requests per service in the first bucket', () => {
    const logs = [
      { startedAt: '2026-01-01T00:30:00Z', moduleName: 'svc-a' },
      { startedAt: '2026-01-01T00:30:00Z', moduleName: 'svc-a' },
    ];

    const { result } = renderHook(() => useRequestsByService(logs, searchParams));

    expect(result.current).toHaveLength(10);
    expect(result.current[0]['svc-a']).toBe(2);
  });
});
