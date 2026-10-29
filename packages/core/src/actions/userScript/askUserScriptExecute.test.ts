import { captureRequester, runStory, StoryError, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askUserScriptExecute } from './askUserScriptExecute';
import { UserScriptActionType } from './UserScriptActionType';

describe('askUserScriptExecute', () => {
  it('yields an Execute action with the drive, file, member and positional args', () => {
    const { action } = captureRequester(askUserScriptExecute('scripts', 'tenant-a/report/main.js', 'build', [1, 2], undefined));

    expect(action).toEqual({
      type: UserScriptActionType.Execute,
      payload: {
        drive: 'scripts',
        filepath: 'tenant-a/report/main.js',
        functionName: 'build',
        args: [[1, 2], undefined],
        scope: undefined,
      },
    });
  });

  it('returns the result the runtime resolves', () => {
    const result = { rows: 3 };
    const { returned } = captureRequester(askUserScriptExecute('scripts', 'tenant-a/report/main.js', 'build'), result);

    expect(returned).toBe(result);
  });

  it('namespaces its error catalog under the action type', () => {
    expect(askUserScriptExecute.errorType.ScriptNotFound).toBe(`${UserScriptActionType.Execute}-ScriptNotFound`);
    expect(askUserScriptExecute.errorType.FunctionThrew).toBe(`${UserScriptActionType.Execute}-FunctionThrew`);
  });

  it('propagates a missing script as a thrown StoryError', () => {
    const runFailingStory = () =>
      runStory(askUserScriptExecute('scripts', 'missing.js', 'anyMember'), {
        [UserScriptActionType.Execute]: throwsError(askUserScriptExecute.errorType.ScriptNotFound, 'User script not found: [missing.js]'),
      });

    expect(runFailingStory).toThrow(StoryError);
    expect(runFailingStory).toThrow(`${askUserScriptExecute.errorType.ScriptNotFound}: User script not found: [missing.js]`);
  });
});
