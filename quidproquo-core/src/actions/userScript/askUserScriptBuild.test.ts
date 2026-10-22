import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, StoryError, throwsError } from '../../testing';
import { askUserScriptBuild } from './askUserScriptBuild';
import { UserScriptActionType } from './UserScriptActionType';

describe('askUserScriptBuild', () => {
  it('yields a Build action naming the drive, source and output directories', () => {
    const { action } = captureRequester(askUserScriptBuild('scripts', 'tenant-a/report/source', 'tenant-a/report/built'));

    expect(action).toEqual({
      type: UserScriptActionType.Build,
      payload: { drive: 'scripts', sourceDirectory: 'tenant-a/report/source', outputDirectory: 'tenant-a/report/built', scope: undefined },
    });
  });

  it('returns the outcome the runtime resolves', () => {
    const outcome = { exports: ['add', 'greet'] };
    const { returned } = captureRequester(askUserScriptBuild('scripts', 'source', 'built'), outcome);

    expect(returned).toBe(outcome);
  });

  it('propagates a missing source as a thrown StoryError with the namespaced type', () => {
    const runFailingStory = () =>
      runStory(askUserScriptBuild('scripts', 'missing', 'built'), {
        [UserScriptActionType.Build]: throwsError(askUserScriptBuild.errorType.SourceNotFound, 'No script entry'),
      });

    expect(runFailingStory).toThrow(StoryError);
    expect(runFailingStory).toThrow(`${UserScriptActionType.Build}-SourceNotFound: No script entry`);
  });
});
