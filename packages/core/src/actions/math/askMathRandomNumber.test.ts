import { captureRequester, runStory, StoryError, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askMathRandomNumber } from './askMathRandomNumber';
import { MathActionType } from './MathActionType';

describe('askMathRandomNumber', () => {
  it('yields a RandomNumber action', () => {
    const { action } = captureRequester(askMathRandomNumber());

    expect(action).toEqual({ type: MathActionType.RandomNumber });
  });

  it('returns the number the runtime resolves', () => {
    const { returned } = captureRequester(askMathRandomNumber(), 0.42);

    expect(returned).toBe(0.42);
  });

  it('propagates a random number failure as a thrown error', () => {
    const run = () =>
      runStory(askMathRandomNumber(), {
        [MathActionType.RandomNumber]: throwsError('GenericError', 'entropy source failed'),
      });

    expect(run).toThrow(StoryError);
    expect(run).toThrow('entropy source failed');
  });
});
