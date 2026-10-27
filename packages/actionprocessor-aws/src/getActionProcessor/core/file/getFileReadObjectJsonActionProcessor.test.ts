import { askFileReadObjectJsonBase, buildTestQpqConfig, FileActionType } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { readTextFile } from '../../../logic/s3/s3Utils';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getFileReadObjectJsonActionProcessor } from './getFileReadObjectJsonActionProcessor';

vi.mock('quidproquo-config-aws', () => ({
  qpqConfigAwsUtils: { getApplicationModuleDeployRegion: () => 'us-test-1' },
}));
vi.mock('./utils', () => ({ resolveStorageDriveBucketName: vi.fn(() => 'bucket-x') }));
vi.mock('../../../logic/s3/s3Utils', () => ({ readTextFile: vi.fn() }));

const invoke = async (payload: { drive: string; filepath: string }) => {
  const processor = (await getFileReadObjectJsonActionProcessor(buildTestQpqConfig(), null as any))[FileActionType.ReadObjectJson];
  return invokeProcessor(processor, payload);
};

describe('getProcessFileReadObjectJson', () => {
  it('parses the JSON file contents', async () => {
    vi.mocked(readTextFile).mockResolvedValue('{"a":1}');

    const [result] = await invoke({ drive: 'assets', filepath: 'a.json' });

    expect(result).toEqual({ a: 1 });
    expect(readTextFile).toHaveBeenCalledWith('bucket-x', 'a.json', 'us-test-1');
  });

  it('maps InvalidObjectState to an invalid storage class error', async () => {
    vi.mocked(readTextFile).mockRejectedValue(Object.assign(new Error('x'), { name: 'InvalidObjectState' }));

    const [, error] = await invoke({ drive: 'assets', filepath: 'a.json' });

    expect(error?.errorType).toBe(askFileReadObjectJsonBase.errorType.InvalidStorageClass);
  });

  it('maps NoSuchKey to the action-typed FileNotFound error', async () => {
    vi.mocked(readTextFile).mockRejectedValue(Object.assign(new Error('x'), { name: 'NoSuchKey' }));

    const [, error] = await invoke({ drive: 'assets', filepath: 'a.json' });

    expect(error?.errorType).toBe(askFileReadObjectJsonBase.errorType.FileNotFound);
  });

  it('maps a JSON.parse failure to the action-typed InvalidJson error', async () => {
    vi.mocked(readTextFile).mockResolvedValue('not json');

    const [, error] = await invoke({ drive: 'assets', filepath: 'a.json' });

    expect(error?.errorType).toBe(askFileReadObjectJsonBase.errorType.InvalidJson);
  });
});
