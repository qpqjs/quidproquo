import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { askFileDelete, FileActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { describe, expect, it, vi } from 'vitest';

import { deleteFiles } from '../../../logic/s3';
import { getFileDeleteActionProcessor } from './getFileDeleteActionProcessor';
import { resolveStorageDriveBucketName } from './utils';

vi.mock('./utils', () => ({ resolveStorageDriveBucketName: vi.fn(() => 'bucket-x') }));
vi.mock('../../../logic/s3', () => ({ deleteFiles: vi.fn() }));

const invoke = async (payload: { drive: string; filepaths: string[] }) => {
  const processor = (await getFileDeleteActionProcessor(buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'us-test-1')]), null as any))[
    FileActionType.Delete
  ];
  return invokeProcessor(processor, payload);
};

describe('getProcessFileDelete', () => {
  it('deletes files from the resolved bucket and region', async () => {
    vi.mocked(deleteFiles).mockResolvedValue([]);

    const [result] = await invoke({ drive: 'assets', filepaths: ['a.txt', 'b.txt'] });

    expect(result).toEqual([]);
    expect(resolveStorageDriveBucketName).toHaveBeenCalledWith('assets', expect.any(Array));
    expect(deleteFiles).toHaveBeenCalledWith('bucket-x', ['a.txt', 'b.txt'], 'us-test-1');
  });

  it('maps AccessDenied to the access denied error', async () => {
    vi.mocked(deleteFiles).mockRejectedValue(Object.assign(new Error('x'), { name: 'AccessDenied' }));

    const [, error] = await invoke({ drive: 'assets', filepaths: ['a.txt'] });

    expect(error?.errorType).toBe(askFileDelete.errorType.AccessDenied);
  });

  it('maps NoSuchBucket to a drive not found error', async () => {
    vi.mocked(deleteFiles).mockRejectedValue(Object.assign(new Error('x'), { name: 'NoSuchBucket' }));

    const [, error] = await invoke({ drive: 'assets', filepaths: ['a.txt'] });

    expect(error?.errorType).toBe(askFileDelete.errorType.DriveNotFound);
  });
});
