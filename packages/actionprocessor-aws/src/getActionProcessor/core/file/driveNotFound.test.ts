import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { askFileDelete, askFileIsColdStorage, askFileWriteTextContents, buildTestQpqConfig, FileActionType } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getFileDeleteActionProcessor } from './getFileDeleteActionProcessor';
import { getFileIsColdStorageActionProcessor } from './getFileIsColdStorageActionProcessor';
import { getFileWriteTextContentsActionProcessor } from './getFileWriteTextContentsActionProcessor';

vi.mock('../../../logic/s3/s3Utils', () => ({
  deleteFiles: vi.fn(),
  writeTextFile: vi.fn(),
}));
vi.mock('../../../logic/s3/getObjectStorageClass', () => ({
  getObjectStorageClass: vi.fn(),
}));

// A drive name that is not declared in the qpq config is a MISCONFIGURATION,
// and it must surface as the action's own typed DriveNotFound error - not a
// bare throw that degrades to GenericError.
const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]);

describe('file drive-not-found error shape', () => {
  it('returns the typed DriveNotFound error from Delete', async () => {
    const processor = (await getFileDeleteActionProcessor(config, {} as any))[FileActionType.Delete];

    const [, error] = await invokeProcessor(processor, { drive: 'missing-drive', filepaths: ['a.txt'] });

    expect(error?.errorType).toBe(askFileDelete.errorType.DriveNotFound);
  });

  it('returns the typed DriveNotFound error from IsColdStorage', async () => {
    const processor = (await getFileIsColdStorageActionProcessor(config, {} as any))[FileActionType.IsColdStorage];

    const [, error] = await invokeProcessor(processor, { drive: 'missing-drive', filepath: 'a.txt' });

    expect(error?.errorType).toBe(askFileIsColdStorage.errorType.DriveNotFound);
  });

  it('returns the typed DriveNotFound error from WriteTextContents', async () => {
    const processor = (await getFileWriteTextContentsActionProcessor(config, {} as any))[FileActionType.WriteTextContents];

    const [, error] = await invokeProcessor(processor, { drive: 'missing-drive', filepath: 'a.txt', data: 'x' });

    expect(error?.errorType).toBe(askFileWriteTextContents.errorType.DriveNotFound);
  });
});
