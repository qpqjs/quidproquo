import { askFileExists, buildTestQpqConfig, FileActionType } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { objectExists } from '../../../logic/s3/s3Utils';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getFileExistsActionProcessor } from './getFileExistsActionProcessor';
import { resolveStorageDriveBucketName } from './utils';

vi.mock('quidproquo-config-aws', () => ({
  qpqConfigAwsUtils: { getApplicationModuleDeployRegion: () => 'us-test-1' },
}));
vi.mock('./utils', () => ({ resolveStorageDriveBucketName: vi.fn(() => 'bucket-x') }));
vi.mock('../../../logic/s3/s3Utils', () => ({ objectExists: vi.fn() }));

const invoke = async (payload: { drive: string; filepath: string }) => {
  const processor = (await getFileExistsActionProcessor(buildTestQpqConfig(), null as any))[FileActionType.Exists];
  return invokeProcessor(processor, payload);
};

describe('getProcessFileExists', () => {
  it('returns whether the object exists', async () => {
    vi.mocked(objectExists).mockResolvedValue(true);

    const [result] = await invoke({ drive: 'assets', filepath: 'a.txt' });

    expect(result).toBe(true);
    expect(objectExists).toHaveBeenCalledWith('bucket-x', 'a.txt', 'us-test-1');
  });

  it.each(['AccessDenied', 'Forbidden'])('maps %s to an access denied error', async (name: string) => {
    vi.mocked(objectExists).mockRejectedValue(Object.assign(new Error('x'), { name }));

    const [, error] = await invoke({ drive: 'assets', filepath: 'a.txt' });

    expect(error?.errorType).toBe(askFileExists.errorType.AccessDenied);
  });
});
