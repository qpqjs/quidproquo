import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, StoryError, throwsError } from '../../testing';
import { askDynamicFunctionExecute } from './askDynamicFunctionExecute';
import { DynamicFunctionsExecuteErrorTypeEnum } from './askDynamicFunctionExecute';
import { DynamicFunctionsActionType } from './DynamicFunctionsActionType';

describe('askDynamicFunctionExecute', () => {
  it('yields an Execute action with the name, member and positional args', () => {
    const { action } = captureRequester(askDynamicFunctionExecute('templateEventDoc', 'foldSnapshotViews', [1, 2], undefined));

    expect(action).toEqual({
      type: DynamicFunctionsActionType.Execute,
      payload: {
        dynamicFunctionsName: 'templateEventDoc',
        functionName: 'foldSnapshotViews',
        args: [[1, 2], undefined],
      },
    });
  });

  it('returns the result the runtime resolves', () => {
    const result = { views: {} };
    const { returned } = captureRequester(askDynamicFunctionExecute('templateEventDoc', 'foldSnapshotViews'), result);

    expect(returned).toBe(result);
  });

  it('propagates an unknown name failure as a thrown StoryError', () => {
    const runFailingStory = () =>
      runStory(askDynamicFunctionExecute('missingFunctions', 'anyMember'), {
        [DynamicFunctionsActionType.Execute]: throwsError(
          DynamicFunctionsExecuteErrorTypeEnum.DynamicFunctionsNotFound,
          'Dynamic functions not found: [missingFunctions]',
        ),
      });

    expect(runFailingStory).toThrow(StoryError);
    expect(runFailingStory).toThrow(
      `${DynamicFunctionsExecuteErrorTypeEnum.DynamicFunctionsNotFound}: Dynamic functions not found: [missingFunctions]`,
    );
  });
});
