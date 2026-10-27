import { ErrorTypeEnum, FileActionType, isErroredActionResult, resolveActionResultError } from 'quidproquo-core';

import * as fs from 'fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fileConfig, runFileAction } from '../../testing/fileProcessorTestHelpers';
import { getFileWriteBinaryContentsActionProcessor } from './getFileWriteBinaryContentsActionProcessor';

vi.mock('fs/promises');

const base64Data = Buffer.from('binary').toString('base64');

const invoke = (data: Record<string, unknown>) =>
  runFileAction(getFileWriteBinaryContentsActionProcessor(fileConfig), FileActionType.WriteBinaryContents, { filepath: 'sub/pic.bin', data });

afterEach(() => {
  vi.clearAllMocks();
});

describe('getFileWriteBinaryContentsActionProcessor', () => {
  it('decodes and writes the buffer without metadata', async () => {
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);

    const result = await invoke({ base64Data });

    expect(isErroredActionResult(result)).toBe(false);
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    expect(fs.writeFile).toHaveBeenCalledWith(expect.stringContaining('pic.bin'), Buffer.from('binary'));
  });

  it('also writes a sidecar metadata file when mimetype is provided', async () => {
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);

    const result = await invoke({ base64Data, mimetype: 'image/png' });

    expect(isErroredActionResult(result)).toBe(false);
    expect(fs.writeFile).toHaveBeenCalledTimes(2);
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('pic.bin.qpqmeta.json'),
      JSON.stringify({ mimetype: 'image/png', contentDisposition: undefined }),
    );
  });

  it('returns GenericError when writing fails', async () => {
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockRejectedValue(new Error('disk full'));

    const result = await invoke({ base64Data });

    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
