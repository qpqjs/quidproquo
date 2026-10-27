import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, StoryError, throwsError } from '../../testing';
import { askDateNow } from './askDateNow';
import { DateActionType } from './DateActionType';

describe('askDateNow', () => {
  it('yields a Now action', () => {
    const { action } = captureRequester(askDateNow());

    expect(action).toEqual({ type: DateActionType.Now });
  });

  it('returns the timestamp the runtime resolves', () => {
    const { returned } = captureRequester(askDateNow(), '2026-06-26T00:00:00.000Z');

    expect(returned).toBe('2026-06-26T00:00:00.000Z');
  });

  it('propagates a clock failure as a thrown error', () => {
    const run = () =>
      runStory(askDateNow(), {
        [DateActionType.Now]: throwsError('GenericError', 'clock unavailable'),
      });

    expect(run).toThrow(StoryError);
    expect(run).toThrow('clock unavailable');
  });
});
