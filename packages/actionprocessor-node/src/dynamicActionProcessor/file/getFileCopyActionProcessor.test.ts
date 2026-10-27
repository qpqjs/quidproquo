import { askFileCopy, FileActionType, isErroredActionResult, resolveActionResultError } from 'quidproquo-core';

import * as fs from 'fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { errorWithCode, fileConfig, runFileAction } from '../../testing/fileProcessorTestHelpers';
import { getFileCopyActionProcessor } from './getFileCopyActionProcessor';

vi.mock('fs/promises');

const invoke = (extra: Record<string, unknown> = {}) =>
  runFileAction(getFileCopyActionProcessor(fileConfig), FileActionType.Copy, {
    sourceDrive: 'media',
    sourceFilepath: 'd1/assets/a',
    targetDrive: 'media',
    targetFilepath: 'd2/assets/b',
    ...extra,
  });

afterEach(() => {
  vi.clearAllMocks();
});

describe('getFileCopyActionProcessor', () => {
  it('copies the object and its sidecar metadata', async () => {
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.copyFile).mockResolvedValue(undefined);

    const result = await invoke();

    expect(isErroredActionResult(result)).toBe(false);
    expect(fs.copyFile).toHaveBeenCalledTimes(2);
    expect(fs.copyFile).toHaveBeenNthCalledWith(1, expect.stringContaining('d1/assets/a'), expect.stringContaining('d2/assets/b'));
    expect(fs.copyFile).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('d1/assets/a.qpqmeta.json'),
      expect.stringContaining('d2/assets/b.qpqmeta.json'),
    );
  });

  it('tolerates a source with no sidecar', async () => {
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.copyFile).mockResolvedValueOnce(undefined).mockRejectedValueOnce(errorWithCode('ENOENT'));

    const result = await invoke();

    expect(isErroredActionResult(result)).toBe(false);
  });

  it('maps a missing source to FileNotFound', async () => {
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.copyFile).mockRejectedValueOnce(errorWithCode('ENOENT'));

    const result = await invoke();

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(askFileCopy.errorType.FileNotFound);
  });

  it('rejects an invalid scope before touching the filesystem', async () => {
    const result = await invoke({ scope: 'bad/scope' });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(askFileCopy.errorType.InvalidScope);
    expect(fs.copyFile).not.toHaveBeenCalled();
  });
});
