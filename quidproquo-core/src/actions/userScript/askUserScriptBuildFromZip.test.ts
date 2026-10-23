import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, StoryError, throwsError } from '../../testing';
import { askUserScriptBuildFromZip } from './askUserScriptBuildFromZip';
import { UserScriptActionType } from './UserScriptActionType';

describe('askUserScriptBuildFromZip', () => {
  it('yields a BuildFromZip action naming the drive, zip file and output directory', () => {
    const { action } = captureRequester(askUserScriptBuildFromZip('scripts', 'doc-1/assets/abc.zip', 'doc-1/built', 'tenant-a'));

    expect(action).toEqual({
      type: UserScriptActionType.BuildFromZip,
      payload: { drive: 'scripts', zipFilepath: 'doc-1/assets/abc.zip', outputDirectory: 'doc-1/built', scope: 'tenant-a' },
    });
  });

  it('returns the outcome the runtime resolves', () => {
    const outcome = { exports: ['add', 'greet'] };
    const { returned } = captureRequester(askUserScriptBuildFromZip('scripts', 'a.zip', 'built'), outcome);

    expect(returned).toBe(outcome);
  });

  it('namespaces the archive errors under its own action type', () => {
    expect(askUserScriptBuildFromZip.errorType.InvalidArchive).toBe(`${UserScriptActionType.BuildFromZip}-InvalidArchive`);
    expect(askUserScriptBuildFromZip.errorType.UnsafeArchiveEntry).toBe(`${UserScriptActionType.BuildFromZip}-UnsafeArchiveEntry`);
  });

  it('propagates an unreadable archive as a thrown StoryError', () => {
    const runFailingStory = () =>
      runStory(askUserScriptBuildFromZip('scripts', 'a.zip', 'built'), {
        [UserScriptActionType.BuildFromZip]: throwsError(askUserScriptBuildFromZip.errorType.InvalidArchive, 'not a zip'),
      });

    expect(runFailingStory).toThrow(StoryError);
    expect(runFailingStory).toThrow(`${UserScriptActionType.BuildFromZip}-InvalidArchive: not a zip`);
  });
});
