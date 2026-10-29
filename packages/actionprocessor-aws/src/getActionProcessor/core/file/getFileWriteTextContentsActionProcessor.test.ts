import { askFileWriteTextContents, FileActionType } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';

import { describe, expect, it, vi } from 'vitest';

import { writeTextFile } from '../../../logic/s3';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getFileWriteTextContentsActionProcessor } from './getFileWriteTextContentsActionProcessor';

vi.mock('@qpqjs/config-aws', () => ({
  qpqConfigAwsUtils: { getApplicationModuleDeployRegion: () => 'us-test-1' },
}));
vi.mock('./utils', () => ({ resolveStorageDriveBucketName: vi.fn(() => 'bucket-x') }));
vi.mock('../../../logic/s3', () => ({ writeTextFile: vi.fn() }));
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

  // Security regression: a scoped write lands under the scope prefix, and a traversal path is refused before S3.
  it('writes under the scope prefix', async () => {
    await invoke({ drive: 'assets', filepath: 'a.txt', data: 'hello', scope: 'tenant-a' });

    expect(vi.mocked(writeTextFile).mock.calls.at(-1)?.[1]).toBe('tenant-a/a.txt');
  });

  it('refuses a traversal path under a scope before touching S3', async () => {
    vi.mocked(writeTextFile).mockClear();

    const [, error] = await invoke({ drive: 'assets', filepath: '../tenant-b/a.txt', data: 'hello', scope: 'tenant-a' });

    expect(error?.errorType).toBe(askFileWriteTextContents.errorType.InvalidScope);
    expect(writeTextFile).not.toHaveBeenCalled();
  });
});
