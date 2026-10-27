import { describe, expect, it } from 'vitest';

import { runStory } from '../../testing/storyTesting';
import { askGetEpochStartTime } from './askGetEpochStartTime';

describe('askGetEpochStartTime', () => {
  it('returns the unix epoch start as an ISO string', () => {
    expect(runStory(askGetEpochStartTime())).toBe('1970-01-01T00:00:00.000Z');
  });
});
