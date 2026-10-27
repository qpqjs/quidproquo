import { describe, expect, it, vi } from 'vitest';

import { askConfigGetParameter } from '../../actions/config/askConfigGetParameter';
import { ConfigActionType } from '../../actions/config/ConfigActionType';
import { runStory } from '../../testing/storyTesting';
import { ActionOf } from '../../types';
import { AskResponse } from '../../types';
import { askArraySome } from './askArraySome';

// True if any id is flagged enabled; short-circuits on the first hit.
function* anyEnabled(ids: string[]): AskResponse<boolean> {
  return yield* askArraySome(ids, function* (id) {
    return (yield* askConfigGetParameter(`enabled/${id}`)) === 'yes';
  });
}

describe('askArraySome', () => {
  it('returns true and stops at the first match', () => {
    const flags: Record<string, string> = { 'enabled/a': 'no', 'enabled/b': 'yes', 'enabled/c': 'yes' };
    const lookup = vi.fn((action: ActionOf<typeof askConfigGetParameter>) => flags[action.payload.parameterName]);

    const result = runStory(anyEnabled(['a', 'b', 'c']), { [ConfigActionType.GetParameter]: lookup });

    expect(result).toBe(true);
    expect(lookup).toHaveBeenCalledTimes(2); // c is never checked
  });

  it('returns false when no item matches', () => {
    const result = runStory(anyEnabled(['a', 'b']), { [ConfigActionType.GetParameter]: 'no' });

    expect(result).toBe(false);
  });
});
