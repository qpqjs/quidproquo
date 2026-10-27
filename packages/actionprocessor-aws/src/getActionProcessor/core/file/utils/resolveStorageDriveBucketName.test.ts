import { buildTestQpqConfig, defineStorageDrive } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { getConfigRuntimeResourceNameFromConfigWithServiceOverride } from '../../../../awsNamingUtils';
import { resolveStorageDriveBucketName } from './resolveStorageDriveBucketName';
import { StorageDriveNotFoundError } from './StorageDriveNotFoundError';

vi.mock('../../../../awsNamingUtils', () => ({
  getConfigRuntimeResourceNameFromConfigWithServiceOverride: vi.fn(() => 'resolved-bucket'),
}));

describe('resolveStorageDriveBucketName', () => {
  it('resolves the runtime bucket name for a known drive', () => {
    const config = buildTestQpqConfig([defineStorageDrive('assets')]);

    const result = resolveStorageDriveBucketName('assets', config);

    expect(result).toBe('resolved-bucket');
    expect(getConfigRuntimeResourceNameFromConfigWithServiceOverride).toHaveBeenCalledWith('assets', config, undefined);
  });

  it('throws the named StorageDriveNotFoundError when the storage drive config is missing', () => {
    const config = buildTestQpqConfig();

    expect(() => resolveStorageDriveBucketName('ghost', config)).toThrow(StorageDriveNotFoundError);
    expect(() => resolveStorageDriveBucketName('ghost', config)).toThrow("Storage drive 'ghost' not found in configuration");
  });
});
