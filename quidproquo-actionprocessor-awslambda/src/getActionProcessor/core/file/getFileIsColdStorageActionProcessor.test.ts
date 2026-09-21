import { buildTestQpqConfig, FileActionType } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { getObjectStorageClass } from '../../../logic/s3/getObjectStorageClass';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getFileIsColdStorageActionProcessor } from './getFileIsColdStorageActionProcessor';

vi.mock('quidproquo-config-aws', () => ({
  qpqConfigAwsUtils: { getApplicationModuleDeployRegion: () => 'us-test-1' },
}));
vi.mock('./utils', () => ({ resolveStorageDriveBucketName: vi.fn(() => 'bucket-x') }));
vi.mock('../../../logic/s3/getObjectStorageClass', () => ({ getObjectStorageClass: vi.fn() }));

const invoke = async (payload: { drive: string; filepath: string }) => {
  const processor = (await getFileIsColdStorageActionProcessor(buildTestQpqConfig(), null as any))[FileActionType.IsColdStorage];
  return invokeProcessor(processor, payload);
};

describe('getProcessFileIsColdStorage', () => {
  it('returns true when the storage class is cold_storage', async () => {
    vi.mocked(getObjectStorageClass).mockResolvedValue('cold_storage');

    const [result] = await invoke({ drive: 'assets', filepath: 'a.txt' });

    expect(result).toBe(true);
    expect(getObjectStorageClass).toHaveBeenCalledWith('bucket-x', 'a.txt', 'us-test-1');
  });

  it('returns false for any other storage class', async () => {
    vi.mocked(getObjectStorageClass).mockResolvedValue('standard');

    const [result] = await invoke({ drive: 'assets', filepath: 'a.txt' });

    expect(result).toBe(false);
  });
});
