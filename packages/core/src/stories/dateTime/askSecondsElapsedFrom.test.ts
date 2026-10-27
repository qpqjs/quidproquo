import { describe, expect, it } from 'vitest';

import { DateActionType } from '../../actions/date/DateActionType';
import { runStory } from '../../testing/storyTesting';
import { askSecondsElapsedFrom } from './askSecondsElapsedFrom';

describe('askSecondsElapsedFrom', () => {
  it('returns the seconds between the two supplied times', () => {
    const result = runStory(askSecondsElapsedFrom('2024-01-01T00:00:00.000Z', '2024-01-01T00:00:30.000Z'));

    expect(result).toBe(30);
  });

  it('falls back to the current time when no end time is given', () => {
    const result = runStory(askSecondsElapsedFrom('2024-01-01T00:00:00.000Z'), {
      [DateActionType.Now]: '2024-01-01T00:01:00.000Z',
    });

    expect(result).toBe(60);
  });

  it('returns a negative number when the end is before the start', () => {
    const result = runStory(askSecondsElapsedFrom('2024-01-01T00:00:10.000Z', '2024-01-01T00:00:00.000Z'));

    expect(result).toBe(-10);
  });
});
