import { captureRequester, runStory, StoryError, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askUserScriptBuild } from './askUserScriptBuild';
import { UserScriptActionType } from './UserScriptActionType';

describe('askUserScriptBuild', () => {
  it('yields a Build action naming the drive, source directory and output file, with source maps off by default', () => {
    const { action } = captureRequester(askUserScriptBuild('scripts', 'tenant-a/report/source', 'tenant-a/report/built.js'));

    expect(action).toEqual({
      type: UserScriptActionType.Build,
      payload: {
        drive: 'scripts',
        sourceDirectory: 'tenant-a/report/source',
        outputFilepath: 'tenant-a/report/built.js',
        scope: undefined,
        sourceMap: false,
      },
    });
  });

  it('carries the scope and the sourceMap option', () => {
    const { action } = captureRequester(askUserScriptBuild('scripts', 'source', 'built.js', 'tenant-a', { sourceMap: true }));

    expect(action.payload).toMatchObject({ scope: 'tenant-a', sourceMap: true });
  });

  it('returns the outcome the runtime resolves', () => {
    const outcome = { exports: ['add', 'greet'] };
    const { returned } = captureRequester(askUserScriptBuild('scripts', 'source', 'built.js'), outcome);

    expect(returned).toBe(outcome);
  });

  it('propagates a missing source as a thrown StoryError with the namespaced type', () => {
    const runFailingStory = () =>
      runStory(askUserScriptBuild('scripts', 'missing', 'built.js'), {
        [UserScriptActionType.Build]: throwsError(askUserScriptBuild.errorType.SourceNotFound, 'No script entry'),
      });

    expect(runFailingStory).toThrow(StoryError);
    expect(runFailingStory).toThrow(`${UserScriptActionType.Build}-SourceNotFound: No script entry`);
  });
});
