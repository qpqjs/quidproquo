import { askFileExists, ErrorTypeEnum, FileActionType, isErroredActionResult, resolveActionResult, resolveActionResultError } from 'quidproquo-core';

import * as fs from 'fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { errorWithCode, fileConfig, runFileAction } from '../../testing/fileProcessorTestHelpers';
import { getFileExistsActionProcessor } from './getFileExistsActionProcessor';

vi.mock('fs/promises');

const invoke = (filepath: string) => runFileAction(getFileExistsActionProcessor(fileConfig), FileActionType.Exists, { filepath });

const runExists = () => invoke('a.txt');

afterEach(() => {
  vi.clearAllMocks();
});

describe('getFileExistsActionProcessor', () => {
  it('returns true when the file is accessible', async () => {
    vi.mocked(fs.access).mockResolvedValue(undefined);

    const result = await runExists();

    expect(resolveActionResult(result)).toBe(true);
  });

  it('returns false when the file is missing', async () => {
    vi.mocked(fs.access).mockRejectedValue(errorWithCode('ENOENT'));

    const result = await runExists();

    expect(resolveActionResult(result)).toBe(false);
  });

  it('returns AccessDenied when permission is refused', async () => {
    vi.mocked(fs.access).mockRejectedValue(errorWithCode('EACCES'));

    const result = await runExists();

    expect(resolveActionResultError(result).errorType).toBe(askFileExists.errorType.AccessDenied);
  });

  it('returns GenericError for any other failure', async () => {
    vi.mocked(fs.access).mockRejectedValue(errorWithCode('EUNKNOWN'));

    const result = await runExists();

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.GenericError);
  });

  it('returns GenericError when the path cannot be resolved', async () => {
    const result = await invoke('/etc/passwd');

    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
