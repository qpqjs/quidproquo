import { AskResponse, askStorageScopeRead, ConfigActionType, KeyValueStoreActionType, runStory, UserDirectoryActionType } from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { DEFAULT_TENANT_HEADER_NAME } from '../constants/tenantGlobalNames';
import { askTenantProvideRequestScope } from './askTenantProvideRequestScope';

// The custom-route tenant gate: header + membership -> story runs under the
// tenant scope; no header -> the caller's own personal scope (NEVER unscoped);
// non-member -> Forbidden.

const buildEvent = (tenantId?: string): HTTPEvent =>
  ({ headers: tenantId ? { [DEFAULT_TENANT_HEADER_NAME]: tenantId } : {} }) as unknown as HTTPEvent;

// The story under the gate just reports the ambient storage scope it sees.
function* askReadAmbientScope(): AskResponse<string | null> {
  return yield* askStorageScopeRead();
}

describe('askTenantProvideRequestScope', () => {
  it('runs the story under the tenant scope when the header passes the membership check', () => {
    const scope = runStory(askTenantProvideRequestScope(buildEvent('tenant-a'), 'app-users', askReadAmbientScope()), {
      [ConfigActionType.GetGlobal]: '',
      [UserDirectoryActionType.ReadAccessToken]: { userId: 'u1' },
      [KeyValueStoreActionType.Query]: { items: [{ userId: 'u1', tenantId: 'tenant-a', role: 'member' }], nextPageKey: undefined },
    });

    expect(scope).toBe('TENANT#tenant-a');
  });

  it('runs the story under the personal scope when no tenant header is present', () => {
    const scope = runStory(askTenantProvideRequestScope(buildEvent(), 'app-users', askReadAmbientScope()), {
      [ConfigActionType.GetGlobal]: '',
      [UserDirectoryActionType.ReadAccessToken]: { userId: 'u1' },
    });

    expect(scope).toBe('PERSONAL#u1');
  });

  it('throws Forbidden when the user is not a member of the claimed tenant', () => {
    const runNonMember = () =>
      runStory(askTenantProvideRequestScope(buildEvent('tenant-b'), 'app-users', askReadAmbientScope()), {
        [ConfigActionType.GetGlobal]: '',
        [UserDirectoryActionType.ReadAccessToken]: { userId: 'u1' },
        [KeyValueStoreActionType.Query]: { items: [{ userId: 'u1', tenantId: 'tenant-a', role: 'member' }], nextPageKey: undefined },
      });

    expect(runNonMember).toThrowError(/not a member/);
  });

  it('throws Unauthorized instead of falling back to unscoped when there is no user', () => {
    const runAnonymous = () =>
      runStory(askTenantProvideRequestScope(buildEvent(), 'app-users', askReadAmbientScope()), {
        [ConfigActionType.GetGlobal]: '',
        [UserDirectoryActionType.ReadAccessToken]: {},
      });

    expect(runAnonymous).toThrowError(/not authenticated/);
  });
});
