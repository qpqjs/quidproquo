import { ConfigActionType, KeyValueStoreActionType, UserDirectoryActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';
import { HTTPEvent } from '@qpqjs/webserver';

import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_TENANT_HEADER_NAME } from '../constants/tenantGlobalNames';
import { askTenantResolveRequestScope } from './askTenantResolveRequestScope';

// The request-time scope gate: always a typed scope, never null/unscoped.

const buildEvent = (tenantId?: string): HTTPEvent =>
  ({ headers: tenantId ? { [DEFAULT_TENANT_HEADER_NAME]: tenantId } : {} }) as unknown as HTTPEvent;

describe('askTenantResolveRequestScope', () => {
  it('resolves a membership-checked tenant header to the tenant scope', () => {
    const scope = runStory(askTenantResolveRequestScope(buildEvent('tenant-a'), 'app-users'), {
      [ConfigActionType.GetGlobal]: '',
      [UserDirectoryActionType.ReadAccessToken]: { userId: 'u1' },
      [KeyValueStoreActionType.Query]: { items: [{ userId: 'u1', tenantId: 'tenant-a', roles: [], grants: [] }], nextPageKey: undefined },
    });

    expect(scope).toBe('TENANT#tenant-a');
  });

  it('resolves no header to the personal scope of the authenticated user', () => {
    const scope = runStory(askTenantResolveRequestScope(buildEvent(), 'app-users'), {
      [ConfigActionType.GetGlobal]: '',
      [UserDirectoryActionType.ReadAccessToken]: { userId: 'u1' },
    });

    expect(scope).toBe('PERSONAL#u1');
  });

  it('throws Forbidden when the user is not a member of the claimed tenant', () => {
    const runNonMember = () =>
      runStory(askTenantResolveRequestScope(buildEvent('tenant-b'), 'app-users'), {
        [ConfigActionType.GetGlobal]: '',
        [UserDirectoryActionType.ReadAccessToken]: { userId: 'u1' },
        [KeyValueStoreActionType.Query]: { items: [{ userId: 'u1', tenantId: 'tenant-a', roles: [], grants: [] }], nextPageKey: undefined },
      });

    expect(runNonMember).toThrowError(/not a member/);
  });

  it('throws Forbidden for a forged personal-scope header value', () => {
    const runForged = () =>
      runStory(askTenantResolveRequestScope(buildEvent('PERSONAL#u2'), 'app-users'), {
        [ConfigActionType.GetGlobal]: '',
        [UserDirectoryActionType.ReadAccessToken]: { userId: 'u1' },
        [KeyValueStoreActionType.Query]: { items: [{ userId: 'u1', tenantId: 'tenant-a', roles: [], grants: [] }], nextPageKey: undefined },
      });

    expect(runForged).toThrowError(/not a member/);
  });

  // Security regression: a disabled membership, or a store answer for a different (user, tenant) pair, never grants the
  // tenant scope.
  it('throws Forbidden for a disabled membership or a row for another pair', () => {
    const runWith = (row: Record<string, unknown>) => () =>
      runStory(askTenantResolveRequestScope(buildEvent('tenant-a'), 'app-users'), {
        [ConfigActionType.GetGlobal]: '',
        [UserDirectoryActionType.ReadAccessToken]: { userId: 'u1' },
        [KeyValueStoreActionType.Query]: { items: [row], nextPageKey: undefined },
      });

    expect(runWith({ userId: 'u1', tenantId: 'tenant-a', roles: [], grants: [], disabled: true })).toThrowError();
    expect(runWith({ userId: 'u2', tenantId: 'tenant-a', roles: [], grants: [] })).toThrowError();
    expect(runWith({ userId: 'u1', tenantId: 'tenant-b', roles: [], grants: [] })).toThrowError();
  });

  // Security regression: a header that is not a plain scope segment is refused before the membership store is read.
  it.each(['tenant/../other', 'tenant-a/x', 'a\u0000b', 't'.repeat(200)])(
    'refuses the malformed tenant header %j without reading the store',
    (header) => {
      const query = vi.fn(() => ({ items: [], nextPageKey: undefined }));

      expect(() =>
        runStory(askTenantResolveRequestScope(buildEvent(header), 'app-users'), {
          [ConfigActionType.GetGlobal]: '',
          [UserDirectoryActionType.ReadAccessToken]: { userId: 'u1' },
          [KeyValueStoreActionType.Query]: query,
        }),
      ).toThrowError();
      expect(query).not.toHaveBeenCalled();
    },
  );

  it('throws Unauthorized rather than resolving anonymously', () => {
    const runAnonymous = () =>
      runStory(askTenantResolveRequestScope(buildEvent(), 'app-users'), {
        [ConfigActionType.GetGlobal]: '',
        [UserDirectoryActionType.ReadAccessToken]: {},
      });

    expect(runAnonymous).toThrowError(/not authenticated/);
  });
});
