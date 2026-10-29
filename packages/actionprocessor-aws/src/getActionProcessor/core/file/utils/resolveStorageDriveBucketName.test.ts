import { buildTestQpqConfig, defineStorageDrive } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { resolveStorageDriveBucketName } from './resolveStorageDriveBucketName';
import { StorageDriveNotFoundError } from './StorageDriveNotFoundError';

describe('resolveStorageDriveBucketName', () => {
  it('resolves the runtime bucket name for an owned drive', () => {
    const config = buildTestQpqConfig([defineStorageDrive('assets')]);

    expect(resolveStorageDriveBucketName('assets', config)).toBe('assets-test-app-test-module-development');
  });

  it('resolves a cross-module drive under the owner context and override name', () => {
    const config = buildTestQpqConfig([defineStorageDrive('assets', { owner: { module: 'media', feature: 'beta', storageDriveName: 'files' } })]);

    expect(resolveStorageDriveBucketName('assets', config)).toBe('files-test-app-media-development-beta');
  });

  it('throws the named StorageDriveNotFoundError when the storage drive config is missing', () => {
    const config = buildTestQpqConfig();

    expect(() => resolveStorageDriveBucketName('ghost', config)).toThrow(StorageDriveNotFoundError);
    expect(() => resolveStorageDriveBucketName('ghost', config)).toThrow("Storage drive 'ghost' not found in configuration");
  });
});
