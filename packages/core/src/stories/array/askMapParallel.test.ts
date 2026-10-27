import { describe, expect, it } from 'vitest';

import { askConfigGetParameter } from '../../actions/config/askConfigGetParameter';
import { ConfigActionType } from '../../actions/config/ConfigActionType';
import { runStory, StoryError, throwsError } from '../../testing/storyTesting';
import { ActionOf } from '../../types';
import { AskResponse } from '../../types';
import { askMapParallel } from './askMapParallel';

// Looks up a display name for each id; the lookups run in parallel as one batch.
function* loadNames(ids: string[]): AskResponse<string[]> {
  return yield* askMapParallel(ids, function* (id) {
    return yield* askConfigGetParameter(`name/${id}`);
  });
}

const names: Record<string, string> = { 'name/a': 'Alice', 'name/b': 'Bob' };

describe('askMapParallel', () => {
  it('maps every item through its action, preserving order', () => {
    const result = runStory(loadNames(['a', 'b']), {
      [ConfigActionType.GetParameter]: (action: ActionOf<typeof askConfigGetParameter>) => names[action.payload.parameterName],
    });

    expect(result).toEqual(['Alice', 'Bob']);
  });

  it('passes the index and source array to the callback', () => {
    function* withIndex(): AskResponse<string[]> {
      return yield* askMapParallel(['x', 'y'], function* (item, index, src) {
        return `${item}@${index}/${src.length}`;
      });
    }

    expect(runStory(withIndex())).toEqual(['x@0/2', 'y@1/2']);
  });

  it('returns an empty array for empty input', () => {
    expect(runStory(loadNames([]))).toEqual([]);
  });

  it('propagates a failing action as a story error', () => {
    const act = () =>
      runStory(loadNames(['a', 'b']), {
        [ConfigActionType.GetParameter]: throwsError('ConfigError', 'parameter missing'),
      });

    expect(act).toThrowError(StoryError);
  });
});
