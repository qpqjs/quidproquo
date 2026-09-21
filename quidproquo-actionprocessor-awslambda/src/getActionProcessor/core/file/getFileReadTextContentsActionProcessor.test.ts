import { askFileReadTextContents, buildTestQpqConfig, FileActionType } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { readTextFile } from '../../../logic/s3/s3Utils';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getFileReadTextContentsActionProcessor } from './getFileReadTextContentsActionProcessor';

vi.mock('quidproquo-config-aws', () => ({
  qpqConfigAwsUtils: { getApplicationModuleDeployRegion: () => 'us-test-1' },
}));
vi.mock('./utils', () => ({ resolveStorageDriveBucketName: vi.fn(() => 'bucket-x') }));
vi.mock('../../../logic/s3/s3Utils', () => ({ readTextFile: vi.fn() }));

const invoke = async (payload: { drive: string; filepath: string }) => {
  const processor = (await getFileReadTextContentsActionProcessor(buildTestQpqConfig(), null as any))[FileActionType.ReadTextContents];
  return invokeProcessor(processor, payload);
};

describe('getProcessFileReadTextContents', () => {
  it('returns the text file contents', async () => {
    vi.mocked(readTextFile).mockResolvedValue('hello');

    const [result] = await invoke({ drive: 'assets', filepath: 'a.txt' });

    expect(result).toBe('hello');
    expect(readTextFile).toHaveBeenCalledWith('bucket-x', 'a.txt', 'us-test-1');
  });

  it('maps InvalidObjectState to an invalid storage class error', async () => {
    vi.mocked(readTextFile).mockRejectedValue(Object.assign(new Error('x'), { name: 'InvalidObjectState' }));

    const [, error] = await invoke({ drive: 'assets', filepath: 'a.txt' });

    expect(error?.errorType).toBe(askFileReadTextContents.errorType.InvalidStorageClass);
  });

  it('maps NoSuchKey to the action-typed FileNotFound error', async () => {
    vi.mocked(readTextFile).mockRejectedValue(Object.assign(new Error('x'), { name: 'NoSuchKey' }));

    const [, error] = await invoke({ drive: 'assets', filepath: 'a.txt' });

    expect(error?.errorType).toBe(askFileReadTextContents.errorType.FileNotFound);
  });
});
