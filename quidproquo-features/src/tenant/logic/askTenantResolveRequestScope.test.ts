import { ConfigActionType, KeyValueStoreActionType, runStory, UserDirectoryActionType } from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

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
      [KeyValueStoreActionType.Query]: { items: [{ userId: 'u1', tenantId: 'tenant-a', role: 'member' }], nextPageKey: undefined },
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
        [KeyValueStoreActionType.Query]: { items: [{ userId: 'u1', tenantId: 'tenant-a', role: 'member' }], nextPageKey: undefined },
      });

    expect(runNonMember).toThrowError(/not a member/);
  });

  it('throws Forbidden for a forged personal-scope header value', () => {
    const runForged = () =>
      runStory(askTenantResolveRequestScope(buildEvent('PERSONAL#u2'), 'app-users'), {
        [ConfigActionType.GetGlobal]: '',
        [UserDirectoryActionType.ReadAccessToken]: { userId: 'u1' },
        [KeyValueStoreActionType.Query]: { items: [{ userId: 'u1', tenantId: 'tenant-a', role: 'member' }], nextPageKey: undefined },
      });

    expect(runForged).toThrowError(/not a member/);
  });

  it('throws Unauthorized rather than resolving anonymously', () => {
    const runAnonymous = () =>
      runStory(askTenantResolveRequestScope(buildEvent(), 'app-users'), {
        [ConfigActionType.GetGlobal]: '',
        [UserDirectoryActionType.ReadAccessToken]: {},
      });

    expect(runAnonymous).toThrowError(/not authenticated/);
  });
});
