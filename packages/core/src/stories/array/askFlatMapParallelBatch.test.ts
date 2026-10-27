import { describe, expect, it } from 'vitest';

import { runStory } from '../../testing/storyTesting';
import { AskResponse } from '../../types';
import { askFlatMapParallelBatch } from './askFlatMapParallelBatch';

describe('askFlatMapParallelBatch', () => {
  it('flattens the per-item arrays into one, preserving order across batches', () => {
    function* story(): AskResponse<number[]> {
      return yield* askFlatMapParallelBatch([1, 2, 3], 2, function* (item): AskResponse<number[]> {
        return [item, item * 10];
      });
    }

    expect(runStory(story())).toEqual([1, 10, 2, 20, 3, 30]);
  });

  it('returns an empty array for empty input', () => {
    function* story(): AskResponse<number[]> {
      return yield* askFlatMapParallelBatch([], 2, function* (item: number): AskResponse<number[]> {
        return [item];
      });
    }

    expect(runStory(story())).toEqual([]);
  });
});
