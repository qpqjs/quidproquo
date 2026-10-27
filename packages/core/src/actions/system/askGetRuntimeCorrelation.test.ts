import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, StoryError, throwsError } from '../../testing';
import { askGetRuntimeCorrelation } from './askGetRuntimeCorrelation';
import { SystemActionType } from './SystemActionType';

describe('askGetRuntimeCorrelation', () => {
  it('yields a GetRuntimeCorrelation action with no payload', () => {
    const { action } = captureRequester(askGetRuntimeCorrelation());

    expect(action).toEqual({ type: SystemActionType.GetRuntimeCorrelation });
  });

  it('returns the correlation guid the runtime resolves', () => {
    const { returned } = captureRequester(askGetRuntimeCorrelation(), 'module::abc-123');

    expect(returned).toBe('module::abc-123');
  });

  it('propagates a correlation lookup failure as a thrown error', () => {
    const run = () =>
      runStory(askGetRuntimeCorrelation(), {
        [SystemActionType.GetRuntimeCorrelation]: throwsError('GenericError', 'no active session'),
      });

    expect(run).toThrow(StoryError);
    expect(run).toThrow('no active session');
  });
});
