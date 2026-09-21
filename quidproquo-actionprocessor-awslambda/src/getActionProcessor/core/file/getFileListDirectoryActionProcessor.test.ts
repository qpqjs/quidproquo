import { buildTestQpqConfig, FileActionType } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { listFiles } from '../../../logic/s3/s3Utils';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getFileListDirectoryActionProcessor } from './getFileListDirectoryActionProcessor';

vi.mock('quidproquo-config-aws', () => ({
  qpqConfigAwsUtils: { getApplicationModuleDeployRegion: () => 'us-test-1' },
}));
vi.mock('./utils', () => ({ resolveStorageDriveBucketName: vi.fn(() => 'bucket-x') }));
vi.mock('../../../logic/s3/s3Utils', () => ({ listFiles: vi.fn() }));

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
});
