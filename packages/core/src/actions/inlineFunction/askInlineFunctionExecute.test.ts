import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, StoryError, throwsError } from '../../testing';
import { ErrorTypeEnum } from '../../types/ErrorTypeEnum';
import { askInlineFunctionExecute } from './askInlineFunctionExecute';
import { InlineFunctionActionType } from './InlineFunctionActionType';

describe('askInlineFunctionExecute', () => {
  it('yields an Execute action with the function name and payload', () => {
    const payload = { a: 1, b: 2 };

    const { action } = captureRequester(askInlineFunctionExecute('doThing', payload));

    expect(action).toEqual({
      type: InlineFunctionActionType.Execute,
      payload: {
        functionName: 'doThing',
        payload,
      },
    });
  });

  it('returns the result the runtime resolves', () => {
    const result = { sum: 3 };
    const { returned } = captureRequester(askInlineFunctionExecute('doThing', { a: 1, b: 2 }), result);

    expect(returned).toBe(result);
  });

  it('propagates an unknown function name failure as a thrown StoryError', () => {
    const runFailingStory = () =>
      runStory(askInlineFunctionExecute('missingFunction', {}), {
        [InlineFunctionActionType.Execute]: throwsError(ErrorTypeEnum.NotFound, 'Unable to find inline function [missingFunction]'),
      });

    expect(runFailingStory).toThrow(StoryError);
    expect(runFailingStory).toThrow(`${ErrorTypeEnum.NotFound}: Unable to find inline function [missingFunction]`);
  });
});
