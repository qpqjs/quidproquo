import { describe, expect, it } from 'vitest';

import { askConfigGetParameter } from '../../actions/config/askConfigGetParameter';
import { ConfigActionType } from '../../actions/config/ConfigActionType';
import { runStory } from '../../testing/storyTesting';
import { ActionOf } from '../../types';
import { AskResponse } from '../../types';
import { askReduce } from './askReduce';

// Sums a fetched amount for each id, starting from the initial value.
function* sumAmounts(ids: string[]): AskResponse<number> {
  return yield* askReduce(ids, 0, function* (total, id) {
    return total + Number(yield* askConfigGetParameter(`amount/${id}`));
  });
}

const amounts: Record<string, string> = { 'amount/a': '10', 'amount/b': '5', 'amount/c': '2' };

describe('askReduce', () => {
  it('accumulates the result across items', () => {
    const result = runStory(sumAmounts(['a', 'b', 'c']), {
      [ConfigActionType.GetParameter]: (action: ActionOf<typeof askConfigGetParameter>) => amounts[action.payload.parameterName],
    });

    expect(result).toBe(17);
  });

  it('returns the initial value for an empty input', () => {
    expect(runStory(sumAmounts([]))).toBe(0);
  });
});
