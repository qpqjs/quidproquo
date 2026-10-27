import { askFileReadTextContents, ErrorTypeEnum, FileActionType, resolveActionResult, resolveActionResultError } from 'quidproquo-core';

import * as fs from 'fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { errorWithCode, fileConfig, runFileAction } from '../../testing/fileProcessorTestHelpers';
import { getFileReadTextContentsActionProcessor } from './getFileReadTextContentsActionProcessor';

vi.mock('fs/promises');

const invoke = () => runFileAction(getFileReadTextContentsActionProcessor(fileConfig), FileActionType.ReadTextContents, { filepath: 'a.txt' });

afterEach(() => {
  vi.clearAllMocks();
});

describe('getFileReadTextContentsActionProcessor', () => {
  it('returns the file contents on success', async () => {
    vi.mocked(fs.readFile).mockResolvedValue('hello world');

    const result = await invoke();

    expect(resolveActionResult(result)).toBe('hello world');
  });

  it('returns the action-typed FileNotFound when the file is missing', async () => {
    vi.mocked(fs.readFile).mockRejectedValue(errorWithCode('ENOENT'));

    const result = await invoke();

    expect(resolveActionResultError(result).errorType).toBe(askFileReadTextContents.errorType.FileNotFound);
  });

  it('returns GenericError for any other failure', async () => {
    vi.mocked(fs.readFile).mockRejectedValue(errorWithCode('EACCES'));

    const result = await invoke();

    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
