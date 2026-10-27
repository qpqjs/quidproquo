import { buildTestQpqConfig, FileActionType } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { getS3BucketStorageClassFromStorageDriveTier } from '../../../awsLambdaUtils';
import { writeBinaryFile } from '../../../logic/s3/s3Utils';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getFileWriteBinaryContentsActionProcessor } from './getFileWriteBinaryContentsActionProcessor';

vi.mock('quidproquo-config-aws', () => ({
  qpqConfigAwsUtils: { getApplicationModuleDeployRegion: () => 'us-test-1' },
}));
vi.mock('./utils', () => ({ resolveStorageDriveBucketName: vi.fn(() => 'bucket-x') }));
vi.mock('../../../logic/s3/s3Utils', () => ({ writeBinaryFile: vi.fn() }));
vi.mock('../../../awsLambdaUtils', () => ({ getS3BucketStorageClassFromStorageDriveTier: vi.fn(() => 'STANDARD') }));

const invoke = async (payload: Record<string, unknown>) => {
  const processor = (await getFileWriteBinaryContentsActionProcessor(buildTestQpqConfig(), null as any))[FileActionType.WriteBinaryContents];
  return invokeProcessor(processor, payload);
};

describe('getProcessFileWriteBinaryContents', () => {
  it('writes binary data with the mapped storage class', async () => {
    const data = new Uint8Array([9, 8, 7]);

    const [result] = await invoke({ drive: 'assets', filepath: 'a.bin', data, storageDriveAdvancedWriteOptions: { storageDriveTier: 'cold' } });

    expect(result).toBeUndefined();
    expect(getS3BucketStorageClassFromStorageDriveTier).toHaveBeenCalledWith('cold');
    expect(writeBinaryFile).toHaveBeenCalledWith('bucket-x', 'a.bin', data, 'us-test-1', 'STANDARD');
  });
});
