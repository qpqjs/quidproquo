import { askFileListDirectory, buildTestQpqConfig, FileActionType } from '@qpqjs/core';

import { describe, expect, it, vi } from 'vitest';

import { listFiles } from '../../../logic/s3';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getFileListDirectoryActionProcessor } from './getFileListDirectoryActionProcessor';

vi.mock('@qpqjs/config-aws', () => ({
  qpqConfigAwsUtils: { getApplicationModuleDeployRegion: () => 'us-test-1' },
}));
vi.mock('./utils', () => ({ resolveStorageDriveBucketName: vi.fn(() => 'bucket-x') }));
vi.mock('../../../logic/s3', () => ({ listFiles: vi.fn() }));

const invoke = async (payload: { drive: string; folderPath: string; maxFiles?: number; pageToken?: string }) => {
  const processor = (await getFileListDirectoryActionProcessor(buildTestQpqConfig(), null as any))[FileActionType.ListDirectory];
  return invokeProcessor(processor, payload);
};

describe('getProcessFileListDirectory', () => {
  it('lists files and stamps the drive onto each entry', async () => {
    vi.mocked(listFiles).mockResolvedValue({
      fileInfos: [{ filepath: 'a.txt', isDir: false }],
      pageToken: 'next',
    });

    const [result] = await invoke({ drive: 'assets', folderPath: 'sub', maxFiles: 10, pageToken: 'tok' });

    expect(listFiles).toHaveBeenCalledWith('bucket-x', 'us-test-1', 'sub', 10, 'tok');
    expect(result).toEqual({
      fileInfos: [{ filepath: 'a.txt', isDir: false, drive: 'assets' }],
      pageToken: 'next',
    });
  });

  // Security regression: a scoped list is prefixed with the scope and stripped back, so one scope can never see
  // another's keys; a traversal folder path is refused before S3 is asked.
  it('lists under the scope prefix and strips it from the returned keys', async () => {
    vi.mocked(listFiles).mockResolvedValue({ fileInfos: [{ filepath: 'tenant-a/sub/a.txt', isDir: false }], pageToken: undefined });

    const [result] = await invoke({ drive: 'assets', folderPath: 'sub', scope: 'tenant-a' } as any);

    expect(vi.mocked(listFiles).mock.calls.at(-1)?.[2]).toBe('tenant-a/sub');
    expect(result?.fileInfos.map((file) => file.filepath)).toEqual(['sub/a.txt']);
  });

  it('refuses a traversal folder path under a scope before touching S3', async () => {
    vi.mocked(listFiles).mockClear();

    const [, error] = await invoke({ drive: 'assets', folderPath: '../tenant-b', scope: 'tenant-a' } as any);

    expect(error?.errorType).toBe(askFileListDirectory.errorType.InvalidScope);
    expect(listFiles).not.toHaveBeenCalled();
  });
});
