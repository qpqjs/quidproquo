import { describe, expect, it } from 'vitest';

import { QpqRuntimeType, StoryResultMetadataWithChildren } from '../../types';
import { getTotalExecutionTime } from './getTotalExecutionTime';

const node = (
  runtimeType: QpqRuntimeType,
  executionTimeMs: number,
  children: StoryResultMetadataWithChildren[] = [],
): StoryResultMetadataWithChildren => ({
  correlation: 'c',
  moduleName: 'm',
  runtimeType,
  startedAt: '2026-01-01T00:00:00.000Z',
  generic: '',
  executionTimeMs,
  children,
});

describe('getTotalExecutionTime', () => {
  it('returns 0 for no logs', () => {
    expect(getTotalExecutionTime([])).toBe(0);
  });

  it('only counts EXECUTE_STORY nodes', () => {
    const logs = [node(QpqRuntimeType.EXECUTE_STORY, 100), node(QpqRuntimeType.API, 999)];

    expect(getTotalExecutionTime(logs)).toBe(100);
  });

  it('sums EXECUTE_STORY nodes recursively through children', () => {
    const tree = node(QpqRuntimeType.API, 999, [
      node(QpqRuntimeType.EXECUTE_STORY, 100, [node(QpqRuntimeType.EXECUTE_STORY, 50)]),
      node(QpqRuntimeType.EXECUTE_STORY, 25),
    ]);

    expect(getTotalExecutionTime([tree])).toBe(175);
  });
});
