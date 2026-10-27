import { askFileDelete, ErrorTypeEnum, FileActionType, resolveActionResult, resolveActionResultError } from 'quidproquo-core';

import * as fs from 'fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { errorWithCode, fileConfig, runFileAction } from '../../testing/fileProcessorTestHelpers';
import { getFileDeleteActionProcessor } from './getFileDeleteActionProcessor';

vi.mock('fs/promises');

const invoke = (filepaths: string[]) => runFileAction(getFileDeleteActionProcessor(fileConfig), FileActionType.Delete, { filepaths });

afterEach(() => {
  vi.clearAllMocks();
});

describe('getFileDeleteActionProcessor', () => {
  it('returns the list of deleted files on success', async () => {
    vi.mocked(fs.unlink).mockResolvedValue(undefined);

    const result = await invoke(['a.txt', 'b.txt']);

    expect(resolveActionResult(result)).toEqual(['a.txt', 'b.txt']);
  });

  it('treats a missing file as already deleted', async () => {
    vi.mocked(fs.unlink).mockRejectedValue(errorWithCode('ENOENT'));

    const result = await invoke(['gone.txt']);

    expect(resolveActionResult(result)).toEqual(['gone.txt']);
  });

  it('returns AccessDenied when every deletion is refused', async () => {
    vi.mocked(fs.unlink).mockRejectedValue(errorWithCode('EACCES'));

    const result = await invoke(['a.txt']);

    expect(resolveActionResultError(result).errorType).toBe(askFileDelete.errorType.AccessDenied);
  });

  it('returns GenericError when every deletion fails for another reason', async () => {
    vi.mocked(fs.unlink).mockRejectedValue(errorWithCode('EBUSY'));

    const result = await invoke(['a.txt']);

    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.GenericError);
  });

  it('reports the deleted files when only some deletions fail', async () => {
    vi.mocked(fs.unlink).mockResolvedValueOnce(undefined).mockRejectedValueOnce(errorWithCode('EACCES'));

    const result = await invoke(['ok.txt', 'denied.txt']);

    expect(resolveActionResult(result)).toEqual(['ok.txt']);
  });
});
