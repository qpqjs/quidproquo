import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { askFileListDirectory, askFileWriteTextContents, defineStorageDrive, FileActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { describe, expect, it, vi } from 'vitest';

import { listFiles, writeTextFile } from '../../../logic/s3';
import { getFileListDirectoryActionProcessor } from './getFileListDirectoryActionProcessor';
import { getFileWriteTextContentsActionProcessor } from './getFileWriteTextContentsActionProcessor';

vi.mock('./utils', () => ({ resolveStorageDriveBucketName: vi.fn(() => 'bucket-x') }));
vi.mock('../../../logic/s3', () => ({ listFiles: vi.fn(), writeTextFile: vi.fn() }));

const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'us-test-1'), defineStorageDrive('tenantFiles', { scoped: true })]);

describe('scoped drive on s3', () => {
  it('refuses an unscoped write and never reaches s3', async () => {
    const processor = (await getFileWriteTextContentsActionProcessor(qpqConfig, null as any))[FileActionType.WriteTextContents];

    const [, error] = await invokeProcessor(processor, { drive: 'tenantFiles', filepath: 'a.txt', data: 'x' });

    expect(error?.errorType).toBe(askFileWriteTextContents.errorType.InvalidScope);
    expect(writeTextFile).not.toHaveBeenCalled();
  });

  it('writes under the scope prefix when a scope is given', async () => {
    const processor = (await getFileWriteTextContentsActionProcessor(qpqConfig, null as any))[FileActionType.WriteTextContents];

    await invokeProcessor(processor, { drive: 'tenantFiles', filepath: 'a.txt', data: 'x', scope: 'TENANT#a' });

    expect(writeTextFile).toHaveBeenCalledWith('bucket-x', 'TENANT#a/a.txt', 'x', 'us-test-1', expect.any(String));
  });

  it('refuses an unscoped directory listing', async () => {
    const processor = (await getFileListDirectoryActionProcessor(qpqConfig, null as any))[FileActionType.ListDirectory];

    const [, error] = await invokeProcessor(processor, { drive: 'tenantFiles', folderPath: '' });

    expect(error?.errorType).toBe(askFileListDirectory.errorType.InvalidScope);
    expect(listFiles).not.toHaveBeenCalled();
  });
});
