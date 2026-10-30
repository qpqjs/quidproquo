import { StoryResultMetadata } from '@qpqjs/core';

import { describe, expect, it, vi } from 'vitest';

import { createHierarchy } from './createHierarchy';

const apiRequestGet = vi.fn();

// Only the network wrapper is replaced: findLogDirectChildren and the memoising `cache` are real,
// so the children come back from the paths the hierarchy asks for.
vi.mock('../../logic/platform/apiRequest', async (importOriginal: <T>() => Promise<T>) => ({
  ...(await importOriginal<object>()),
  apiRequestGet: (...args: unknown[]) => apiRequestGet(...args),
}));

const childrenByPath = (children: Record<string, StoryResultMetadata[]>) =>
  apiRequestGet.mockImplementation(async (path: string) => ({ items: children[path] ?? [] }));

const meta = (correlation: string, startedAt: string): StoryResultMetadata => ({ correlation, startedAt }) as StoryResultMetadata;

describe('createHierarchy', () => {
  it('attaches children sorted by startedAt', async () => {
    childrenByPath({ '/log/children/root-h': [meta('b', '2026-01-02'), meta('a', '2026-01-01')] });

    const result = await createHierarchy(meta('root-h', '2026-01-01'), 'https://api', 'token');

    expect(result.children.map((c) => c.correlation)).toEqual(['a', 'b']);
    expect(result.correlation).toBe('root-h');
  });

  it('returns an empty children list for a leaf', async () => {
    childrenByPath({});

    const result = await createHierarchy(meta('leaf-h', '2026-01-01'), 'https://api');

    expect(result.children).toEqual([]);
  });
});
