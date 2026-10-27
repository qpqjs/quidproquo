import { StoryResultMetadata } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { createHierarchy } from './createHierarchy';

const fineLogDirectChildren = vi.fn();

vi.mock('../../logic', () => ({
  cache: (fn: unknown) => fn,
}));

vi.mock('./findLogDirectChildren', () => ({
  fineLogDirectChildren: (...args: unknown[]) => fineLogDirectChildren(...args),
}));

const meta = (correlation: string, startedAt: string): StoryResultMetadata => ({ correlation, startedAt }) as StoryResultMetadata;

describe('createHierarchy', () => {
  it('attaches children sorted by startedAt', async () => {
    fineLogDirectChildren.mockResolvedValueOnce([meta('b', '2026-01-02'), meta('a', '2026-01-01')]).mockResolvedValue([]);

    const result = await createHierarchy(meta('root', '2026-01-01'), 'https://api', 'token');

    expect(result.children.map((c) => c.correlation)).toEqual(['a', 'b']);
    expect(result.correlation).toBe('root');
  });

  it('returns an empty children list for a leaf', async () => {
    fineLogDirectChildren.mockResolvedValue([]);

    const result = await createHierarchy(meta('leaf', '2026-01-01'), 'https://api');

    expect(result.children).toEqual([]);
  });
});
