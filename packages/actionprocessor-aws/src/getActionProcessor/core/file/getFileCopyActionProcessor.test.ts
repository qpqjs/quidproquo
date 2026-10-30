import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { askFileCopy, FileActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { describe, expect, it, vi } from 'vitest';

import { copyFile } from '../../../logic/s3';
import { getFileCopyActionProcessor } from './getFileCopyActionProcessor';
import { resolveStorageDriveBucketName } from './utils';

vi.mock('./utils', () => ({ resolveStorageDriveBucketName: vi.fn((drive: string) => `bucket-${drive}`) }));
vi.mock('../../../logic/s3', () => ({ copyFile: vi.fn() }));

const payload = { sourceDrive: 'renders', sourceFilepath: 'd1/assets/a', targetDrive: 'packs', targetFilepath: 'd2/assets/b' };

const invoke = async (extra: Record<string, unknown> = {}) => {
  const processor = (await getFileCopyActionProcessor(buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'us-test-1')]), null as any))[
    FileActionType.Copy
  ];
  return invokeProcessor(processor!, { ...payload, ...extra });
};

describe('getProcessFileCopy', () => {
  it('copies between the resolved buckets in the deploy region', async () => {
    vi.mocked(copyFile).mockResolvedValue(undefined);

    const [result, error] = await invoke();

    expect(error).toBeUndefined();
    expect(result).toBeUndefined();
    expect(resolveStorageDriveBucketName).toHaveBeenCalledWith('renders', expect.any(Array));
    expect(resolveStorageDriveBucketName).toHaveBeenCalledWith('packs', expect.any(Array));
    expect(copyFile).toHaveBeenCalledWith('bucket-renders', 'd1/assets/a', 'bucket-packs', 'd2/assets/b', 'us-test-1');
  });

  it('prefixes both paths with the scope', async () => {
    vi.mocked(copyFile).mockResolvedValue(undefined);

    await invoke({ scope: 'tenant-1' });

    expect(copyFile).toHaveBeenCalledWith('bucket-renders', 'tenant-1/d1/assets/a', 'bucket-packs', 'tenant-1/d2/assets/b', 'us-test-1');
  });

  it('maps NoSuchKey to a file not found error', async () => {
    vi.mocked(copyFile).mockRejectedValue(Object.assign(new Error('x'), { name: 'NoSuchKey' }));

    const [, error] = await invoke();

    expect(error?.errorType).toBe(askFileCopy.errorType.FileNotFound);
  });

  it('maps AccessDenied to the access denied error', async () => {
    vi.mocked(copyFile).mockRejectedValue(Object.assign(new Error('x'), { name: 'AccessDenied' }));

    const [, error] = await invoke();

    expect(error?.errorType).toBe(askFileCopy.errorType.AccessDenied);
  });

  it('rejects an invalid scope before touching S3', async () => {
    vi.mocked(copyFile).mockClear();

    const [, error] = await invoke({ scope: 'bad/scope' });

    expect(error?.errorType).toBe(askFileCopy.errorType.InvalidScope);
    expect(copyFile).not.toHaveBeenCalled();
  });
});
