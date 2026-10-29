import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { FileActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { describe, expect, it, vi } from 'vitest';

import { writeTextFile } from '../../../logic/s3';
import { getFileWriteObjectJsonActionProcessor } from './getFileWriteObjectJsonActionProcessor';

vi.mock('./utils', () => ({ resolveStorageDriveBucketName: vi.fn(() => 'bucket-x') }));
vi.mock('../../../logic/s3', () => ({ writeTextFile: vi.fn() }));
vi.mock('../../../awsLambdaUtils', () => ({ getS3BucketStorageClassFromStorageDriveTier: vi.fn(() => 'STANDARD') }));

const invoke = async (payload: Record<string, unknown>) => {
  const processor = (
    await getFileWriteObjectJsonActionProcessor(buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'us-test-1')]), null as any)
  )[FileActionType.WriteObjectJson];
  return invokeProcessor(processor, payload);
};

describe('getProcessFileWriteObjectJson', () => {
  it('serializes the object and writes it as text', async () => {
    const [result] = await invoke({ drive: 'assets', filepath: 'a.json', data: { a: 1 } });

    expect(result).toBeUndefined();
    expect(writeTextFile).toHaveBeenCalledWith('bucket-x', 'a.json', '{"a":1}', 'us-test-1', 'STANDARD');
  });
});
