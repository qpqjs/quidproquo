import { buildTestQpqConfig, ErrorTypeEnum, FileActionType } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { generatePresignedUploadUrl } from '../../../logic/s3/generatePresignedUploadUrl';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getFileGenerateTemporaryUploadSecureUrlActionProcessor } from './getFileGenerateTemporaryUploadSecureUrlActionProcessor';

vi.mock('quidproquo-config-aws', () => ({
  qpqConfigAwsUtils: { getApplicationModuleDeployRegion: () => 'us-test-1' },
}));
vi.mock('./utils', () => ({ resolveStorageDriveBucketName: vi.fn(() => 'bucket-x') }));
vi.mock('../../../logic/s3/generatePresignedUploadUrl', () => ({ generatePresignedUploadUrl: vi.fn() }));

const session = { correlation: 'corr-1' };

const invoke = async (payload: { drive: string; filepath: string; expirationMs: number; contentType?: string; contentDisposition?: string }) => {
  const processor = (await getFileGenerateTemporaryUploadSecureUrlActionProcessor(buildTestQpqConfig(), null as any))[
    FileActionType.GenerateTemporaryUploadSecureUrl
  ];
  return invokeProcessor(processor, payload, { session });
};

describe('getProcessFileGenerateTemporaryUploadSecureUrl', () => {
  it('returns the presigned upload url with the session correlation', async () => {
    vi.mocked(generatePresignedUploadUrl).mockResolvedValue('https://upload');

    const [result] = await invoke({
      drive: 'assets',
      filepath: 'a.txt',
      expirationMs: 1000,
      contentType: 'text/plain',
      contentDisposition: 'attachment; filename="a.txt"',
    });

    expect(result).toBe('https://upload');
    expect(generatePresignedUploadUrl).toHaveBeenCalledWith(
      'bucket-x',
      'a.txt',
      'us-test-1',
      1000,
      'corr-1',
      'text/plain',
      'attachment; filename="a.txt"',
    );
  });

  it('maps a thrown error to a generic error', async () => {
    vi.mocked(generatePresignedUploadUrl).mockRejectedValue(new Error('nope'));

    const [, error] = await invoke({ drive: 'assets', filepath: 'a.txt', expirationMs: 1000 });

    expect(error?.errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
