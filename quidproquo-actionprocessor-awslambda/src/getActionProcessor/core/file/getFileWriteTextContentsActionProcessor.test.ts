import { buildTestQpqConfig, FileActionType } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { getS3BucketStorageClassFromStorageDriveTier } from '../../../awsLambdaUtils';
import { writeTextFile } from '../../../logic/s3/s3Utils';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getFileWriteTextContentsActionProcessor } from './getFileWriteTextContentsActionProcessor';

vi.mock('quidproquo-config-aws', () => ({
  qpqConfigAwsUtils: { getApplicationModuleDeployRegion: () => 'us-test-1' },
}));
vi.mock('./utils', () => ({ resolveStorageDriveBucketName: vi.fn(() => 'bucket-x') }));
vi.mock('../../../logic/s3/s3Utils', () => ({ writeTextFile: vi.fn() }));
vi.mock('../../../awsLambdaUtils', () => ({ getS3BucketStorageClassFromStorageDriveTier: vi.fn(() => 'STANDARD') }));

const invoke = async (payload: Record<string, unknown>) => {
  const processor = (await getFileWriteTextContentsActionProcessor(buildTestQpqConfig(), null as any))[FileActionType.WriteTextContents];
  return invokeProcessor(processor, payload);
};

describe('getProcessFileWriteTextContents', () => {
  it('writes the text contents with the mapped storage class', async () => {
    const [result] = await invoke({ drive: 'assets', filepath: 'a.txt', data: 'hello' });

    expect(result).toBeUndefined();
    expect(writeTextFile).toHaveBeenCalledWith('bucket-x', 'a.txt', 'hello', 'us-test-1', 'STANDARD');
  });
});
