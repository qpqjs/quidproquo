import { describe, expect, it } from 'vitest';

import { DateActionType } from '../../actions/date/DateActionType';
import { runStory } from '../../testing/storyTesting';
import { askGetCurrentEpochMs } from './askGetCurrentEpochMs';

describe('askGetCurrentEpochMs', () => {
  it('converts the current ISO time to epoch milliseconds', () => {
    const result = runStory(askGetCurrentEpochMs(), { [DateActionType.Now]: '1970-01-01T00:00:01.500Z' });

    expect(result).toBe(1500);
  });
});
