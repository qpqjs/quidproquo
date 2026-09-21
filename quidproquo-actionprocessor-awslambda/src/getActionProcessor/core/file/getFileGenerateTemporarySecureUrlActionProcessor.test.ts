import { askFileGenerateTemporarySecureUrl, buildTestQpqConfig, ErrorTypeEnum, FileActionType } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { generatePresignedUrl } from '../../../logic/s3/generatePresignedUrl';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getFileGenerateTemporarySecureUrlActionProcessor } from './getFileGenerateTemporarySecureUrlActionProcessor';

vi.mock('quidproquo-config-aws', () => ({
  qpqConfigAwsUtils: { getApplicationModuleDeployRegion: () => 'us-test-1' },
}));
vi.mock('./utils', () => ({ resolveStorageDriveBucketName: vi.fn(() => 'bucket-x') }));
vi.mock('../../../logic/s3/generatePresignedUrl', () => ({ generatePresignedUrl: vi.fn() }));

const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

const invoke = async (payload: { drive: string; filepath: string; expirationMs: number }) => {
  const processor = (await getFileGenerateTemporarySecureUrlActionProcessor(buildTestQpqConfig(), null as any))[
    FileActionType.GenerateTemporarySecureUrl
  ];
  return invokeProcessor(processor, payload);
};

describe('getProcessFileGenerateTemporarySecureUrl', () => {
  beforeEach(() => {
    vi.mocked(generatePresignedUrl).mockClear();
  });

  it('returns the presigned url', async () => {
    vi.mocked(generatePresignedUrl).mockResolvedValue('https://signed');

    const [result] = await invoke({ drive: 'assets', filepath: 'a.txt', expirationMs: 1000 });

    expect(result).toBe('https://signed');
    expect(generatePresignedUrl).toHaveBeenCalledWith('bucket-x', 'a.txt', 'us-test-1', 1000);
  });

  it('rejects an expiration over the 7 day maximum', async () => {
    const [, error] = await invoke({ drive: 'assets', filepath: 'a.txt', expirationMs: sevenDaysMs + 1 });

    expect(error?.errorType).toBe(askFileGenerateTemporarySecureUrl.errorType.ExpirationTooLong);
    expect(generatePresignedUrl).not.toHaveBeenCalled();
  });

  it('maps a thrown error to a generic error', async () => {
    vi.mocked(generatePresignedUrl).mockRejectedValue(new Error('nope'));

    const [, error] = await invoke({ drive: 'assets', filepath: 'a.txt', expirationMs: 1000 });

    expect(error?.errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
