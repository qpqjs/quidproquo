import { describe, expect, it } from 'vitest';

import { runStory } from '../../testing/storyTesting';
import { AskResponse } from '../../types';
import { askFlatMap } from './askFlatMap';

describe('askFlatMap', () => {
  it('flattens the per-item arrays into one, preserving order', () => {
    function* story(): AskResponse<string[]> {
      return yield* askFlatMap(['a', 'b'], function* (item, index): AskResponse<string[]> {
        return [item, `${index}`];
      });
    }

    expect(runStory(story())).toEqual(['a', '0', 'b', '1']);
  });

  it('drops items that map to an empty array', () => {
    function* story(): AskResponse<number[]> {
      return yield* askFlatMap([1, 2, 3], function* (item): AskResponse<number[]> {
        return item % 2 === 0 ? [item] : [];
      });
    }

    expect(runStory(story())).toEqual([2]);
  });

  it('returns an empty array for empty input', () => {
    function* story(): AskResponse<number[]> {
      return yield* askFlatMap([], function* (item: number): AskResponse<number[]> {
        return [item];
      });
    }

    expect(runStory(story())).toEqual([]);
  });
});
