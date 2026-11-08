import { StorageDriveTier } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { getS3StorageClassNameForStorageDriveTier } from './getS3StorageClassNameForStorageDriveTier';

describe('getS3StorageClassNameForStorageDriveTier', () => {
  it.each([
    [StorageDriveTier.REGULAR, 'STANDARD'],
    [StorageDriveTier.OCCASIONAL_ACCESS, 'STANDARD_IA'],
    [StorageDriveTier.SINGLE_ZONE_OCCASIONAL_ACCESS, 'ONEZONE_IA'],
    [StorageDriveTier.COLD_STORAGE, 'GLACIER'],
    [StorageDriveTier.COLD_STORAGE_INSTANT_ACCESS, 'GLACIER_IR'],
    [StorageDriveTier.DEEP_COLD_STORAGE, 'DEEP_ARCHIVE'],
    [StorageDriveTier.SMART_TIERING, 'INTELLIGENT_TIERING'],
  ])('maps %s to the %s storage class', (tier: StorageDriveTier, expected: string) => {
    expect(getS3StorageClassNameForStorageDriveTier(tier)).toBe(expected);
  });

  it('defaults to INTELLIGENT_TIERING when the tier is omitted', () => {
    expect(getS3StorageClassNameForStorageDriveTier()).toBe('INTELLIGENT_TIERING');
  });
});
