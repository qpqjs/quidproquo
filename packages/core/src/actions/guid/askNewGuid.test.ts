import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, StoryError, throwsError } from '../../testing';
import { askNewGuid } from './askNewGuid';
import { GuidActionType } from './GuidActionType';

describe('askNewGuid', () => {
  it('yields a New action', () => {
    const { action } = captureRequester(askNewGuid());

    expect(action).toEqual({ type: GuidActionType.New });
  });

  it('returns the guid the runtime resolves', () => {
    const { returned } = captureRequester(askNewGuid(), 'abc-123');

    expect(returned).toBe('abc-123');
  });

  it('propagates a guid generation failure as a thrown error', () => {
    const run = () =>
      runStory(askNewGuid(), {
        [GuidActionType.New]: throwsError('GenericError', 'guid service down'),
      });

    expect(run).toThrow(StoryError);
    expect(run).toThrow('guid service down');
  });
});
