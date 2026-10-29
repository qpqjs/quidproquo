import { runStory, StoryError, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { ActionOf } from '../../types';
import { askFileListAllDirectory } from './askFileListAllDirectory';
import { askFileListDirectory } from './askFileListDirectory';
import { FileActionType } from './FileActionType';
import { FileInfo } from './types';

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
        cursor = page!.pageToken ?? 'done';
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
