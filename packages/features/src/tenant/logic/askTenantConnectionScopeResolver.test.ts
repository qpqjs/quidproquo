import { KeyValueStoreActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it, vi } from 'vitest';

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
      [KeyValueStoreActionType.Query]: { items: [{ userId: 'u1', tenantId: 'tenant-a', roles: [], grants: [] }], nextPageKey: undefined },
    });

    expect(scope).toBe('TENANT#tenant-a');
  });

  it('throws Forbidden for a tenant claim without membership', () => {
    const runNonMember = () =>
      runStory(askTenantConnectionScopeResolver({ userId: 'u1', requestedScope: 'tenant-b' }), {
        [KeyValueStoreActionType.Query]: { items: [{ userId: 'u1', tenantId: 'tenant-a', roles: [], grants: [] }], nextPageKey: undefined },
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

  // Security regression: a disabled membership or a store row for another pair never grants the tenant scope, and a
  // malformed claim is refused before the membership store is read.
  it('throws Forbidden for a disabled membership or a row for another pair', () => {
    const runWith = (row: Record<string, unknown>) => () =>
      runStory(askTenantConnectionScopeResolver({ userId: 'u1', requestedScope: 'tenant-a' }), {
        [KeyValueStoreActionType.Query]: { items: [row], nextPageKey: undefined },
      });

    expect(runWith({ userId: 'u1', tenantId: 'tenant-a', roles: [], grants: [], disabled: true })).toThrowError();
    expect(runWith({ userId: 'u2', tenantId: 'tenant-a', roles: [], grants: [] })).toThrowError();
  });

  it.each(['tenant/../other', 'a\u0000b', 't'.repeat(200)])('refuses the malformed claim %j without reading the store', (requestedScope: any) => {
    const query = vi.fn(() => ({ items: [], nextPageKey: undefined }));

    expect(() =>
      runStory(askTenantConnectionScopeResolver({ userId: 'u1', requestedScope }), { [KeyValueStoreActionType.Query]: query }),
    ).toThrowError();
    expect(query).not.toHaveBeenCalled();
  });
});
