import { askFileReadBinaryContents, ErrorTypeEnum, FileActionType, resolveActionResult, resolveActionResultError } from 'quidproquo-core';

import * as fs from 'fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { errorWithCode, fileConfig, runFileAction } from '../../testing/fileProcessorTestHelpers';
import { getFileReadBinaryContentsActionProcessor } from './getFileReadBinaryContentsActionProcessor';

vi.mock('fs/promises');

const invoke = () =>
  runFileAction(getFileReadBinaryContentsActionProcessor(fileConfig), FileActionType.ReadBinaryContents, { filepath: 'nested/pic.bin' });

afterEach(() => {
  vi.clearAllMocks();
});

describe('getFileReadBinaryContentsActionProcessor', () => {
  it('returns base64-encoded binary data with the basename', async () => {
    vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('binary'));

    const result = await invoke();

    expect(resolveActionResult(result)).toEqual({
      base64Data: Buffer.from('binary').toString('base64'),
      filename: 'pic.bin',
      mimetype: 'application/octet-stream',
    });
  });

  it('returns FileNotFound when the file is missing', async () => {
    vi.mocked(fs.readFile).mockRejectedValue(errorWithCode('ENOENT'));

    const result = await invoke();

    expect(resolveActionResultError(result).errorType).toBe(askFileReadBinaryContents.errorType.FileNotFound);
  });

  it('returns GenericError for any other failure', async () => {
    vi.mocked(fs.readFile).mockRejectedValue(errorWithCode('EIO'));

    const result = await invoke();

    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
