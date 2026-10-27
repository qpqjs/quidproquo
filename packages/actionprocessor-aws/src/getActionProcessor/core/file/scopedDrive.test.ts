import { askFileListDirectory, askFileWriteTextContents, buildTestQpqConfig, defineStorageDrive, FileActionType } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { listFiles, writeTextFile } from '../../../logic/s3/s3Utils';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getFileListDirectoryActionProcessor } from './getFileListDirectoryActionProcessor';
import { getFileWriteTextContentsActionProcessor } from './getFileWriteTextContentsActionProcessor';

vi.mock('quidproquo-config-aws', () => ({
  qpqConfigAwsUtils: { getApplicationModuleDeployRegion: () => 'us-test-1' },
}));
vi.mock('./utils', () => ({ resolveStorageDriveBucketName: vi.fn(() => 'bucket-x') }));
vi.mock('../../../logic/s3/s3Utils', () => ({ listFiles: vi.fn(), writeTextFile: vi.fn() }));

const qpqConfig = buildTestQpqConfig([defineStorageDrive('tenantFiles', { scoped: true })]);

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
