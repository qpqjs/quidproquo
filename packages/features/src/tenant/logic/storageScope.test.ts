import { describe, expect, it } from 'vitest';

import { composePersonalScope, composeTenantScope, getTenantIdFromScope, parseStorageScope, StorageScopeType } from './storageScope';
import { toTenantId } from './toTenantId';

const tenantA = toTenantId('tenant-a');

describe('composeTenantScope / composePersonalScope', () => {
  it('composes typed scope segments', () => {
    expect(composeTenantScope(tenantA)).toBe('TENANT#tenant-a');
    expect(composePersonalScope('u1')).toBe('PERSONAL#u1');
  });

  it('rejects ids that are not valid scope segments', () => {
    expect(() => toTenantId('')).toThrowError();
    expect(() => toTenantId('a/b')).toThrowError();
    expect(() => composePersonalScope('user@host')).toThrowError();
    expect(() => composePersonalScope('..')).toThrowError();
  });
});

describe('parseStorageScope', () => {
  it('round-trips both scope types', () => {
    expect(parseStorageScope(composeTenantScope(tenantA))).toEqual({ type: StorageScopeType.tenant, id: 'tenant-a' });
    expect(parseStorageScope(composePersonalScope('u1'))).toEqual({ type: StorageScopeType.personal, id: 'u1' });
  });

  it('returns null for unknown or prefix-only values', () => {
    expect(parseStorageScope('tenant-a')).toBeNull();
    expect(parseStorageScope('TENANT#')).toBeNull();
    expect(parseStorageScope('PERSONAL#')).toBeNull();
    expect(parseStorageScope('')).toBeNull();
  });
});

describe('getTenantIdFromScope', () => {
  it('returns the id only for tenant scopes', () => {
    expect(getTenantIdFromScope('TENANT#tenant-a')).toBe('tenant-a');
    expect(getTenantIdFromScope('PERSONAL#u1')).toBeNull();
    expect(getTenantIdFromScope('something-else')).toBeNull();
  });

  // Security regression: a tenant id is never read out of a personal scope, and the prefix match is exact, so a
  // personal partition can never be mistaken for a tenant one.
  it('never reads a tenant id out of a personal scope or a prefix lookalike', () => {
    expect(getTenantIdFromScope('PERSONAL#TENANT#tenant-a')).toBeNull();
    expect(getTenantIdFromScope('PERSONAL#u1')).toBeNull();
    expect(parseStorageScope('tenant#a')).toBeNull();
    expect(parseStorageScope(' TENANT#a')).toBeNull();
    expect(() => composeTenantScope(toTenantId('a/../b'))).toThrowError();
  });
});
