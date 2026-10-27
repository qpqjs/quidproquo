import { ErrorTypeEnum, FileActionType, isErroredActionResult, resolveActionResultError } from 'quidproquo-core';

import * as fs from 'fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fileConfig, runFileAction } from '../../testing/fileProcessorTestHelpers';
import { getFileWriteObjectJsonActionProcessor } from './getFileWriteObjectJsonActionProcessor';

vi.mock('fs/promises');

const invoke = (data: unknown) =>
  runFileAction(getFileWriteObjectJsonActionProcessor(fileConfig), FileActionType.WriteObjectJson, { filepath: 'sub/data.json', data });

afterEach(() => {
  vi.clearAllMocks();
});

describe('getFileWriteObjectJsonActionProcessor', () => {
  it('writes the pretty-printed json on success', async () => {
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);

    const result = await invoke({ a: 1 });

    expect(isErroredActionResult(result)).toBe(false);
    expect(fs.writeFile).toHaveBeenCalledWith(expect.stringContaining('data.json'), JSON.stringify({ a: 1 }, null, 2), 'utf8');
  });

  it('returns GenericError when writing fails', async () => {
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockRejectedValue(new Error('disk full'));

    const result = await invoke({ a: 1 });

    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
