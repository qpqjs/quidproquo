import { askFileListDirectory, FileActionType, resolveActionResult, resolveActionResultError } from 'quidproquo-core';

import * as fs from 'fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { errorWithCode, fileConfig, runFileAction } from '../../testing/fileProcessorTestHelpers';
import { getFileListDirectoryActionProcessor } from './getFileListDirectoryActionProcessor';

vi.mock('fs/promises');

const dirent = (name: string, isDir: boolean) => ({ name, isDirectory: () => isDir }) as any;

const invoke = (payload: { folderPath?: string; maxFiles: number; pageToken?: string }) =>
  runFileAction(getFileListDirectoryActionProcessor(fileConfig), FileActionType.ListDirectory, payload);

afterEach(() => {
  vi.clearAllMocks();
});

describe('getFileListDirectoryActionProcessor', () => {
  it('returns a sorted directory listing with drive and dir flags', async () => {
    vi.mocked(fs.readdir).mockResolvedValue([dirent('b.txt', false), dirent('a-dir', true)]);

    const result = await invoke({ folderPath: 'root', maxFiles: 10 });

    expect(resolveActionResult(result)).toEqual({
      fileInfos: [
        { filepath: 'root/a-dir', drive: 'media', isDir: true, hashMd5: undefined },
        { filepath: 'root/b.txt', drive: 'media', isDir: false, hashMd5: undefined },
      ],
    });
  });

  it('paginates and exposes a page token when more files remain', async () => {
    vi.mocked(fs.readdir).mockResolvedValue([dirent('a', false), dirent('b', false), dirent('c', false)]);

    const result = await invoke({ folderPath: '', maxFiles: 2 });

    const list = resolveActionResult(result) as { fileInfos: { filepath: string }[]; pageToken?: string };
    expect(list.fileInfos.map((f: any) => f.filepath)).toEqual(['a', 'b']);
    expect(list.pageToken).toBe('2');
  });

  it('resumes from a supplied page token', async () => {
    vi.mocked(fs.readdir).mockResolvedValue([dirent('a', false), dirent('b', false), dirent('c', false)]);

    const result = await invoke({ folderPath: '', maxFiles: 2, pageToken: '2' });

    const list = resolveActionResult(result) as { fileInfos: { filepath: string }[]; pageToken?: string };
    expect(list.fileInfos.map((f: any) => f.filepath)).toEqual(['c']);
    expect(list.pageToken).toBeUndefined();
  });

  it('returns DirectoryNotFound when the directory is missing', async () => {
    vi.mocked(fs.readdir).mockRejectedValue(errorWithCode('ENOENT'));

    const result = await invoke({ folderPath: 'nope', maxFiles: 10 });

    expect(resolveActionResultError(result).errorType).toBe(askFileListDirectory.errorType.DirectoryNotFound);
  });

  it('returns NotADirectory when the path is not a directory', async () => {
    vi.mocked(fs.readdir).mockRejectedValue(errorWithCode('ENOTDIR'));

    const result = await invoke({ folderPath: 'file.txt', maxFiles: 10 });

    expect(resolveActionResultError(result).errorType).toBe(askFileListDirectory.errorType.NotADirectory);
  });

  it('returns AccessDenied when permission is denied', async () => {
    vi.mocked(fs.readdir).mockRejectedValue(errorWithCode('EACCES'));

    const result = await invoke({ folderPath: 'x', maxFiles: 10 });

    expect(resolveActionResultError(result).errorType).toBe(askFileListDirectory.errorType.AccessDenied);
  });
});
