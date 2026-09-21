import { buildTestQpqConfig, FileActionType } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { getS3BucketStorageClassFromStorageDriveTier } from '../../../awsLambdaUtils';
import { writeTextFile } from '../../../logic/s3/s3Utils';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getFileWriteObjectJsonActionProcessor } from './getFileWriteObjectJsonActionProcessor';

vi.mock('quidproquo-config-aws', () => ({
  qpqConfigAwsUtils: { getApplicationModuleDeployRegion: () => 'us-test-1' },
}));
vi.mock('./utils', () => ({ resolveStorageDriveBucketName: vi.fn(() => 'bucket-x') }));
vi.mock('../../../logic/s3/s3Utils', () => ({ writeTextFile: vi.fn() }));
vi.mock('../../../awsLambdaUtils', () => ({ getS3BucketStorageClassFromStorageDriveTier: vi.fn(() => 'STANDARD') }));

const invoke = async (payload: Record<string, unknown>) => {
  const processor = (await getFileWriteObjectJsonActionProcessor(buildTestQpqConfig(), null as any))[FileActionType.WriteObjectJson];
  return invokeProcessor(processor, payload);
};

describe('getProcessFileWriteObjectJson', () => {
  it('serializes the object and writes it as text', async () => {
    const [result] = await invoke({ drive: 'assets', filepath: 'a.json', data: { a: 1 } });

    expect(result).toBeUndefined();
    expect(writeTextFile).toHaveBeenCalledWith('bucket-x', 'a.json', '{"a":1}', 'us-test-1', 'STANDARD');
  });
});
