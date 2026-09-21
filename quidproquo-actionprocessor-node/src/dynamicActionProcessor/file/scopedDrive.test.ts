import {
  askFileCopy,
  askFileIsColdStorage,
  askFileListDirectory,
  askFileWriteTextContents,
  FileActionType,
  resolveActionResultError,
} from 'quidproquo-core';

import * as fs from 'fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fileConfig, runFileAction } from '../../testing/fileProcessorTestHelpers';
import { getFileCopyActionProcessor } from './getFileCopyActionProcessor';
import { getFileIsColdStorageActionProcessor } from './getFileIsColdStorageActionProcessor';
import { getFileListDirectoryActionProcessor } from './getFileListDirectoryActionProcessor';
import { getFileWriteTextContentsActionProcessor } from './getFileWriteTextContentsActionProcessor';

vi.mock('fs/promises');

afterEach(() => {
  vi.clearAllMocks();
});

describe('scoped drive on the local filesystem', () => {
  it('refuses an unscoped write with the typed InvalidScope error and never touches disk', async () => {
    const result = await runFileAction(getFileWriteTextContentsActionProcessor(fileConfig), FileActionType.WriteTextContents, {
      drive: 'tenantMedia',
      filepath: 'a.txt',
      data: 'x',
    });

    expect(resolveActionResultError(result).errorType).toBe(askFileWriteTextContents.errorType.InvalidScope);
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('writes under the scope folder when a scope is given', async () => {
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);

    await runFileAction(getFileWriteTextContentsActionProcessor(fileConfig), FileActionType.WriteTextContents, {
      drive: 'tenantMedia',
      filepath: 'a.txt',
      data: 'x',
      scope: 'TENANT#a',
    });

    expect(fs.writeFile).toHaveBeenCalledWith(expect.stringContaining('tenantMedia/TENANT#a/a.txt'), 'x', 'utf8');
  });

  it('refuses an unscoped directory listing (the cross-tenant leak)', async () => {
    const result = await runFileAction(getFileListDirectoryActionProcessor(fileConfig), FileActionType.ListDirectory, {
      drive: 'tenantMedia',
      folderPath: '',
    });

    expect(resolveActionResultError(result).errorType).toBe(askFileListDirectory.errorType.InvalidScope);
  });

  it('refuses a copy whose target is a scoped drive when no scope is given', async () => {
    const result = await runFileAction(getFileCopyActionProcessor(fileConfig), FileActionType.Copy, {
      sourceDrive: 'media',
      sourceFilepath: 'a.txt',
      targetDrive: 'tenantMedia',
      targetFilepath: 'a.txt',
    });

    expect(resolveActionResultError(result).errorType).toBe(askFileCopy.errorType.InvalidScope);
  });

  it('refuses an unscoped cold-storage check even though the local fs has no cold tier', async () => {
    const result = await runFileAction(getFileIsColdStorageActionProcessor(fileConfig), FileActionType.IsColdStorage, {
      drive: 'tenantMedia',
      filepath: 'a.txt',
    });

    expect(resolveActionResultError(result).errorType).toBe(askFileIsColdStorage.errorType.InvalidScope);
  });
});
