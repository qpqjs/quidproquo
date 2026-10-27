import { describe, expect, it } from 'vitest';

import { DateActionType } from '../../actions/date/DateActionType';
import { runStory } from '../../testing/storyTesting';
import { askGetCurrentEpoch } from './askGetCurrentEpoch';

describe('askGetCurrentEpoch', () => {
  it('returns the current epoch in whole seconds', () => {
    const result = runStory(askGetCurrentEpoch(), { [DateActionType.Now]: '1970-01-01T00:00:01.500Z' });

    expect(result).toBe(1);
  });
});
