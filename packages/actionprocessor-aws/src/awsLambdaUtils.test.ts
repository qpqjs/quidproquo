import { StorageDriveTier } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getS3BucketStorageClassFromStorageDriveTier, matchUrl, randomGuid } from './awsLambdaUtils';

describe('randomGuid', () => {
  it('returns a v4-shaped uuid', () => {
    expect(randomGuid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('returns a different value each call', () => {
    expect(randomGuid()).not.toBe(randomGuid());
  });
});

describe('matchUrl', () => {
  it('matches a templated path and extracts its params', () => {
    expect(matchUrl('/attempt/{attemptUuid}/result/{test}', '/attempt/123/result/abc')).toEqual({
      didMatch: true,
      params: { attemptUuid: '123', test: 'abc' },
    });
  });

  it('matches a static path with no params', () => {
    const result = matchUrl('/health', '/health');

    expect(result.didMatch).toBe(true);
  });

  it('does not match when the path differs', () => {
    expect(matchUrl('/attempt/{id}', '/result/123').didMatch).toBe(false);
  });
});

describe('getS3BucketStorageClassFromStorageDriveTier', () => {
  it.each([
    [StorageDriveTier.REGULAR, 'STANDARD'],
    [StorageDriveTier.OCCASIONAL_ACCESS, 'STANDARD_IA'],
    [StorageDriveTier.SINGLE_ZONE_OCCASIONAL_ACCESS, 'ONEZONE_IA'],
    [StorageDriveTier.COLD_STORAGE, 'GLACIER'],
    [StorageDriveTier.COLD_STORAGE_INSTANT_ACCESS, 'GLACIER_IR'],
    [StorageDriveTier.DEEP_COLD_STORAGE, 'DEEP_ARCHIVE'],
    [StorageDriveTier.SMART_TIERING, 'INTELLIGENT_TIERING'],
  ])('maps %s to the %s storage class', (tier: StorageDriveTier, expected: string) => {
    expect(getS3BucketStorageClassFromStorageDriveTier(tier)).toBe(expected);
  });

  it('defaults to INTELLIGENT_TIERING when the tier is omitted', () => {
    expect(getS3BucketStorageClassFromStorageDriveTier()).toBe('INTELLIGENT_TIERING');
  });
});
