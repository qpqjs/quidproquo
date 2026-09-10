import { KeyValueStoreActionType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askTenantConnectionScopeResolver } from './askTenantConnectionScopeResolver';

// The ws Authenticate scope resolver: a tenant-aware connection always ends up
// scoped - membership-checked tenant claim, or the user's own personal scope.

describe('askTenantConnectionScopeResolver', () => {
  it('resolves no claim to the personal scope of the user', () => {
    const scope = runStory(askTenantConnectionScopeResolver({ userId: 'u1', requestedScope: null }), {});

    expect(scope).toBe('PERSONAL#u1');
  });

  it('resolves a tenant claim to the tenant scope when the user is a member', () => {
    const scope = runStory(askTenantConnectionScopeResolver({ userId: 'u1', requestedScope: 'tenant-a' }), {
      [KeyValueStoreActionType.Query]: { items: [{ userId: 'u1', tenantId: 'tenant-a', role: 'member' }], nextPageKey: undefined },
    });

    expect(scope).toBe('TENANT#tenant-a');
  });

  it('throws Forbidden for a tenant claim without membership', () => {
    const runNonMember = () =>
      runStory(askTenantConnectionScopeResolver({ userId: 'u1', requestedScope: 'tenant-b' }), {
        [KeyValueStoreActionType.Query]: { items: [{ userId: 'u1', tenantId: 'tenant-a', role: 'member' }], nextPageKey: undefined },
      });

    expect(runNonMember).toThrowError(/not a member/);
  });

  it('accepts a claim of the user own personal scope', () => {
    const scope = runStory(askTenantConnectionScopeResolver({ userId: 'u1', requestedScope: 'PERSONAL#u1' }), {});

    expect(scope).toBe('PERSONAL#u1');
  });

  it('throws Forbidden for a claim of another user personal scope', () => {
    const runForeign = () => runStory(askTenantConnectionScopeResolver({ userId: 'u1', requestedScope: 'PERSONAL#u2' }), {});

    expect(runForeign).toThrowError(/personal scope/);
  });
});
