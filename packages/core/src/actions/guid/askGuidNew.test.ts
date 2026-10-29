import { captureRequester, runStory, StoryError, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askGuidNew } from './askGuidNew';
import { GuidActionType } from './GuidActionType';

describe('askGuidNew', () => {
  it('yields a New action', () => {
    const { action } = captureRequester(askGuidNew());

    expect(action).toEqual({ type: GuidActionType.New });
  });

  it('returns the guid the runtime resolves', () => {
    const { returned } = captureRequester(askGuidNew(), 'abc-123');

    expect(returned).toBe('abc-123');
  });

  it('propagates a guid generation failure as a thrown error', () => {
    const run = () =>
      runStory(askGuidNew(), {
        [GuidActionType.New]: throwsError('GenericError', 'guid service down'),
      });

    expect(run).toThrow(StoryError);
    expect(run).toThrow('guid service down');
  });
});
