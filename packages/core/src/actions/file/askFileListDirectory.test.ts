import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, StoryError, throwsError } from '../../testing';
import { ActionOf } from '../../types';
import { askFileListAllDirectory, askFileListDirectory } from './askFileListDirectory';
import { FileActionType, FileInfo } from './FileActionType';

describe('askFileListDirectory', () => {
  it('yields a ListDirectory action carrying the drive, folder, page token and max files', () => {
    const { action } = captureRequester(askFileListDirectory('drive', 'folder', 50, 'next'));

    expect(action).toEqual({
      type: FileActionType.ListDirectory,
      payload: { drive: 'drive', folderPath: 'folder', pageToken: 'next', maxFiles: 50 },
    });
  });

  it('defaults maxFiles to 1000 and leaves the page token undefined when omitted', () => {
    const { action } = captureRequester(askFileListDirectory('drive', 'folder'));

    expect(action.payload).toEqual({ drive: 'drive', folderPath: 'folder', pageToken: undefined, maxFiles: 1000 });
  });

  it('returns the value the runtime resolves', () => {
    const directoryInfo = { fileInfos: [], pageToken: undefined };
    const { returned } = captureRequester(askFileListDirectory('drive', 'folder'), directoryInfo);

    expect(returned).toBe(directoryInfo);
  });

  it('forwards the scope onto the payload', () => {
    const { action } = captureRequester(askFileListDirectory('drive', 'folder', 1000, undefined, 'scope-a'));

    expect(action.payload.scope).toBe('scope-a');
  });
});

describe('askFileListAllDirectory', () => {
  const file = (filepath: string): FileInfo => ({ filepath, drive: 'drive', isDir: false });

  it('accumulates file infos across pages until the page token runs out', () => {
    const pages: Record<string, { fileInfos: FileInfo[]; pageToken?: string }> = {
      first: { fileInfos: [file('a'), file('b')], pageToken: 'p2' },
      p2: { fileInfos: [file('c')], pageToken: 'p3' },
      p3: { fileInfos: [file('d')], pageToken: undefined },
    };

    let cursor = 'first';
    const result = runStory(askFileListAllDirectory('drive', 'folder'), {
      [FileActionType.ListDirectory]: () => {
        const page = pages[cursor];
        cursor = page.pageToken ?? 'done';
        return page;
      },
    });

    expect(result).toEqual([file('a'), file('b'), file('c'), file('d')]);
  });

  it('forwards the previous page token on each follow-up request', () => {
    const tokens: (string | undefined)[] = [];
    const pages: { fileInfos: FileInfo[]; pageToken?: string }[] = [
      { fileInfos: [file('a')], pageToken: 'next' },
      { fileInfos: [file('b')], pageToken: undefined },
    ];

    let index = 0;
    runStory(askFileListAllDirectory('drive', 'folder'), {
      [FileActionType.ListDirectory]: (action: ActionOf<typeof askFileListDirectory>) => {
        tokens.push(action.payload.pageToken);
        return pages[index++];
      },
    });

    expect(tokens).toEqual([undefined, 'next']);
  });

  it('returns a single page of files when there is no page token', () => {
    const result = runStory(askFileListAllDirectory('drive', 'folder'), {
      [FileActionType.ListDirectory]: { fileInfos: [file('only')], pageToken: undefined },
    });

    expect(result).toEqual([file('only')]);
  });

  it('forwards the scope on every page request', () => {
    const scopes: (string | undefined)[] = [];
    const pages: { fileInfos: FileInfo[]; pageToken?: string }[] = [
      { fileInfos: [file('a')], pageToken: 'next' },
      { fileInfos: [file('b')], pageToken: undefined },
    ];

    let index = 0;
    runStory(askFileListAllDirectory('drive', 'folder', 'scope-a'), {
      [FileActionType.ListDirectory]: (action: ActionOf<typeof askFileListDirectory>) => {
        scopes.push(action.payload.scope);
        return pages[index++];
      },
    });

    expect(scopes).toEqual(['scope-a', 'scope-a']);
  });

  it('propagates a listing failure instead of returning a partial result', () => {
    const list = () =>
      runStory(askFileListAllDirectory('drive', 'folder'), {
        [FileActionType.ListDirectory]: throwsError('SomeErrorType', 'boom'),
      });

    expect(list).toThrow(StoryError);
    expect(list).toThrow('SomeErrorType: boom');
  });
});
