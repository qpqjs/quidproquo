import { ErrorTypeEnum, FileActionType, isErroredActionResult, resolveActionResultError } from 'quidproquo-core';

import * as fs from 'fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fileConfig, runFileAction } from '../../testing/fileProcessorTestHelpers';
import { getFileWriteTextContentsActionProcessor } from './getFileWriteTextContentsActionProcessor';

vi.mock('fs/promises');

const invoke = (data: string) =>
  runFileAction(getFileWriteTextContentsActionProcessor(fileConfig), FileActionType.WriteTextContents, { filepath: 'sub/a.txt', data });

afterEach(() => {
  vi.clearAllMocks();
});

describe('getFileWriteTextContentsActionProcessor', () => {
  it('ensures the parent directory and writes the file', async () => {
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);

    const result = await invoke('hello');

    expect(isErroredActionResult(result)).toBe(false);
    expect(fs.mkdir).toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalledWith(expect.stringContaining('a.txt'), 'hello', 'utf8');
  });

  it('returns GenericError when writing fails', async () => {
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockRejectedValue(new Error('disk full'));

    const result = await invoke('hello');

    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
