import { describe, expect, it } from 'vitest';

import { askConfigGetParameter } from '../../actions/config/askConfigGetParameter';
import { ConfigActionType } from '../../actions/config/ConfigActionType';
import { runStory } from '../../testing/storyTesting';
import { ActionOf } from '../../types';
import { AskResponse } from '../../types';
import { askFilter } from './askFilter';

// Keeps only the ids whose fetched status is 'active'.
function* keepActive(ids: string[]): AskResponse<string[]> {
  return yield* askFilter(ids, function* (id) {
    return (yield* askConfigGetParameter(`status/${id}`)) === 'active';
  });
}

const statuses: Record<string, string> = { 'status/a': 'active', 'status/b': 'disabled', 'status/c': 'active' };

describe('askFilter', () => {
  it('keeps items whose async predicate is true', () => {
    const result = runStory(keepActive(['a', 'b', 'c']), {
      [ConfigActionType.GetParameter]: (action: ActionOf<typeof askConfigGetParameter>) => statuses[action.payload.parameterName],
    });

    expect(result).toEqual(['a', 'c']);
  });

  it('returns an empty array when nothing matches', () => {
    const result = runStory(keepActive(['b']), { [ConfigActionType.GetParameter]: 'disabled' });

    expect(result).toEqual([]);
  });
});
