import { describe, expect, it } from 'vitest';

import { askConfigGetParameter } from '../../actions/config/askConfigGetParameter';
import { ConfigActionType } from '../../actions/config/ConfigActionType';
import { runStory } from '../../testing/storyTesting';
import { ActionOf } from '../../types';
import { AskResponse } from '../../types';
import { askMap } from './askMap';

// Looks up a display name for each id by yielding an action per item.
function* loadNames(ids: string[]): AskResponse<string[]> {
  return yield* askMap(ids, function* (id) {
    return yield* askConfigGetParameter(`name/${id}`);
  });
}

const names: Record<string, string> = { 'name/a': 'Alice', 'name/b': 'Bob' };

describe('askMap', () => {
  it('maps each item through the action, preserving order', () => {
    const result = runStory(loadNames(['a', 'b']), {
      [ConfigActionType.GetParameter]: (action: ActionOf<typeof askConfigGetParameter>) => names[action.payload.parameterName],
    });

    expect(result).toEqual(['Alice', 'Bob']);
  });

  it('passes the index and source array to the callback', () => {
    function* withIndex(): AskResponse<string[]> {
      return yield* askMap(['x', 'y'], function* (item, index, src) {
        return `${item}@${index}/${src.length}`;
      });
    }

    expect(runStory(withIndex())).toEqual(['x@0/2', 'y@1/2']);
  });

  it('returns an empty array without yielding for an empty input', () => {
    expect(runStory(loadNames([]))).toEqual([]);
  });
});
