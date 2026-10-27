import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, StoryError, throwsError } from '../../testing';
import { askRandomNumber } from './askRandomNumber';
import { MathActionType } from './MathActionType';

describe('askRandomNumber', () => {
  it('yields a RandomNumber action', () => {
    const { action } = captureRequester(askRandomNumber());

    expect(action).toEqual({ type: MathActionType.RandomNumber });
  });

  it('returns the number the runtime resolves', () => {
    const { returned } = captureRequester(askRandomNumber(), 0.42);

    expect(returned).toBe(0.42);
  });

  it('propagates a random number failure as a thrown error', () => {
    const run = () =>
      runStory(askRandomNumber(), {
        [MathActionType.RandomNumber]: throwsError('GenericError', 'entropy source failed'),
      });

    expect(run).toThrow(StoryError);
    expect(run).toThrow('entropy source failed');
  });
});
