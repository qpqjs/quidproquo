import { describe, expect, it } from 'vitest';

import { QpqRuntimeType, StoryResultMetadataWithChildren } from '../../types';
import { getTimeBounds } from './getTimeBounds';

const node = (startedAt: string, executionTimeMs: number, children: StoryResultMetadataWithChildren[] = []): StoryResultMetadataWithChildren => ({
  correlation: 'c',
  moduleName: 'm',
  runtimeType: QpqRuntimeType.EXECUTE_STORY,
  startedAt,
  generic: '',
  executionTimeMs,
  children,
});

describe('getTimeBounds', () => {
  it('returns empty bounds for no logs', () => {
    expect(getTimeBounds([])).toEqual({ earliestStartedAt: '', latestFinishedAt: '' });
  });

  it('derives bounds from a single node start plus execution time', () => {
    expect(getTimeBounds([node('2026-01-01T00:00:00.000Z', 1000)])).toEqual({
      earliestStartedAt: '2026-01-01T00:00:00.000Z',
      latestFinishedAt: '2026-01-01T00:00:01.000Z',
    });
  });

  it('finds the earliest start and latest finish across children', () => {
    const tree = node('2026-01-01T00:00:05.000Z', 1000, [node('2026-01-01T00:00:00.000Z', 2000), node('2026-01-01T00:00:10.000Z', 5000)]);

    expect(getTimeBounds([tree])).toEqual({
      earliestStartedAt: '2026-01-01T00:00:00.000Z',
      latestFinishedAt: '2026-01-01T00:00:15.000Z',
    });
  });

  it('skips nodes with an unparseable startedAt instead of throwing', () => {
    const logs = [node('not-a-date', 1000), node('2026-01-01T00:00:00.000Z', 1000)];

    expect(getTimeBounds(logs)).toEqual({
      earliestStartedAt: '2026-01-01T00:00:00.000Z',
      latestFinishedAt: '2026-01-01T00:00:01.000Z',
    });
  });

  it('skips nodes with an empty startedAt instead of throwing', () => {
    expect(getTimeBounds([node('', 1000)])).toEqual({ earliestStartedAt: '', latestFinishedAt: '' });
  });

  it('skips a non-finite executionTimeMs instead of throwing', () => {
    expect(getTimeBounds([node('2026-01-01T00:00:00.000Z', NaN)])).toEqual({
      earliestStartedAt: '2026-01-01T00:00:00.000Z',
      latestFinishedAt: '',
    });
  });
});
