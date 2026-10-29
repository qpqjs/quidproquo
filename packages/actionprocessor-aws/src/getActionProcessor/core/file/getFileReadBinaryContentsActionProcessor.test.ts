import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { FileActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { describe, expect, it, vi } from 'vitest';

import { readBinaryFile } from '../../../logic/s3';
import { getFileReadBinaryContentsActionProcessor } from './getFileReadBinaryContentsActionProcessor';

vi.mock('./utils', () => ({ resolveStorageDriveBucketName: vi.fn(() => 'bucket-x') }));
vi.mock('../../../logic/s3', () => ({ readBinaryFile: vi.fn() }));

const invoke = async (payload: { drive: string; filepath: string }) => {
  const processor = (
    await getFileReadBinaryContentsActionProcessor(buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'us-test-1')]), null as any)
  )[FileActionType.ReadBinaryContents];
  return invokeProcessor(processor, payload);
};

describe('getProcessFileReadBinaryContents', () => {
  it('reads binary contents from the resolved bucket', async () => {
    const data = new Uint8Array([1, 2, 3]);
    vi.mocked(readBinaryFile).mockResolvedValue(data);

    const [result] = await invoke({ drive: 'assets', filepath: 'a.bin' });

    expect(result).toBe(data);
    expect(readBinaryFile).toHaveBeenCalledWith('bucket-x', 'a.bin', 'us-test-1');
  });
});
