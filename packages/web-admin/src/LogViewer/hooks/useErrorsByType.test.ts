import { StoryResultMetadata } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useErrorsByType } from './useErrorsByType';

const log = (error?: string): StoryResultMetadata => ({ error }) as StoryResultMetadata;

describe('useErrorsByType', () => {
  it('counts and sorts errors by frequency descending', () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const logs = [log('boom'), log('boom'), log('crash'), log(undefined)];

    const { result } = renderHook(() => useErrorsByType(logs));

    expect(result.current).toEqual([
      { count: 2, errorText: 'boom' },
      { count: 1, errorText: 'crash' },
    ]);
  });

  it('truncates error text longer than 100 characters', () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const longError = 'x'.repeat(150);

    const { result } = renderHook(() => useErrorsByType([log(longError)]));

    expect(result.current[0].errorText).toBe('x'.repeat(100) + '...');
  });
});
