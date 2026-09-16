import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, StoryError, throwsError } from '../../testing';
import { askGetRuntimeRemainingTime } from './askGetRuntimeRemainingTime';
import { SystemActionType } from './SystemActionType';

describe('askGetRuntimeRemainingTime', () => {
  it('yields a GetRuntimeRemainingTime action with no payload', () => {
    const { action } = captureRequester(askGetRuntimeRemainingTime());

    expect(action).toEqual({ type: SystemActionType.GetRuntimeRemainingTime });
  });

  it('returns the milliseconds the runtime resolves', () => {
    const { returned } = captureRequester(askGetRuntimeRemainingTime(), 12345);

    expect(returned).toBe(12345);
  });

  it('propagates a lookup failure as a thrown error', () => {
    const run = () =>
      runStory(askGetRuntimeRemainingTime(), {
        [SystemActionType.GetRuntimeRemainingTime]: throwsError('GenericError', 'no runtime'),
      });

    expect(run).toThrow(StoryError);
    expect(run).toThrow('no runtime');
  });
});
