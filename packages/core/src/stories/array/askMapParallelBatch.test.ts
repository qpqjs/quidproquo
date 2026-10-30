import { runStory } from '@qpqjs/testing';

import { describe, expect, it, vi } from 'vitest';

import { PlatformActionType } from '../../actions/platform/PlatformActionType';
import { AskResponse } from '../../types';
import { askMapParallelBatch } from './askMapParallelBatch';

function* doubleInBatches(items: number[], numBatch: number, delayMs = 0): AskResponse<number[]> {
  return yield* askMapParallelBatch(
    items,
    numBatch,
    function* (item): AskResponse<number> {
      return item * 10;
    },
    delayMs,
  );
}

describe('askMapParallelBatch', () => {
  it('processes every item across batches, preserving order', () => {
    expect(runStory(doubleInBatches([1, 2, 3, 4, 5], 2))).toEqual([10, 20, 30, 40, 50]);
  });

  it('returns an empty array for empty input without delaying', () => {
    const delay = vi.fn();
    expect(runStory(doubleInBatches([], 2, 100), { [PlatformActionType.Delay]: delay })).toEqual([]);
    expect(delay).not.toHaveBeenCalled();
  });

  it('delays once after each batch', () => {
    const delay = vi.fn();
    runStory(doubleInBatches([1, 2, 3, 4, 5], 2, 100), { [PlatformActionType.Delay]: delay });

    expect(delay).toHaveBeenCalledTimes(3);
  });

  it('passes the index into the original array and the original array itself', () => {
    function* withIndex(): AskResponse<string[]> {
      return yield* askMapParallelBatch(['a', 'b', 'c'], 2, function* (item, index, src): AskResponse<string> {
        return `${item}@${index}/${src.length}`;
      });
    }

    expect(runStory(withIndex())).toEqual(['a@0/3', 'b@1/3', 'c@2/3']);
  });

  it('throws Invalid when the batch size cannot make progress', () => {
    expect(() => runStory(doubleInBatches([1, 2], 0))).toThrowError(/numBatch must be at least 1/);
    expect(() => runStory(doubleInBatches([1, 2], -1))).toThrowError(/numBatch must be at least 1/);
    expect(() => runStory(doubleInBatches([1, 2], Number.NaN))).toThrowError(/numBatch must be at least 1/);
  });
});
