import { runStory, StateActionType } from 'quidproquo-core';
import { ApiActionType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { toTenantId } from '../../logic/toTenantId';
import { TenantClientTarget } from '../../models/TenantClientTarget';
import { TenantMembershipUiEffect } from '../effects/TenantMembershipUiEffect';
import { askTenantMembershipUiLoad } from './askTenantMembershipUiLoad';

const target: TenantClientTarget = { service: 'ca', myTenantsBasePath: '/my-tenants' };
const tenantId = toTenantId('tenant-a');

const buildMocks = (respond: (endpoint: string) => { status: number; data: unknown }) => {
  const dispatched: { type: string; payload: unknown }[] = [];
  const requested: string[] = [];
  const mocks = {
    [StateActionType.Dispatch]: (action: { payload: { action: { type: string; payload: unknown } } }) => {
      dispatched.push(action.payload.action);
    },
    [ApiActionType.Request]: (action: { payload: { endpoint: string } }) => {
      requested.push(action.payload.endpoint);
      return respond(action.payload.endpoint);
    },
  };
  return { mocks, dispatched, requested };
};

describe('askTenantMembershipUiLoad', () => {
  it('fetches the standing and the role picker from the versioned base path', () => {
    const { mocks, dispatched, requested } = buildMocks((endpoint) =>
      endpoint.endsWith('/membership') ? { status: 200, data: { userId: 'u1', permissions: [] } } : { status: 200, data: [{ code: 'x', name: 'X' }] },
    );

    runStory(askTenantMembershipUiLoad(target, tenantId), mocks);

    expect(requested).toEqual(['/v1/my-tenants/tenant-a/membership', '/v1/my-tenants/tenant-a/roles']);
    expect(dispatched.map((effect) => effect.type)).toEqual([
      TenantMembershipUiEffect.SetLoading,
      TenantMembershipUiEffect.SetError,
      TenantMembershipUiEffect.SetMembership,
      TenantMembershipUiEffect.SetRoles,
      TenantMembershipUiEffect.SetLoading,
    ]);
    expect(dispatched[dispatched.length - 1]).toEqual({ type: TenantMembershipUiEffect.SetLoading, payload: { isLoading: false } });
  });

  it("surfaces the server's refusal as the error and still clears loading", () => {
    const { mocks, dispatched } = buildMocks(() => ({ status: 403, data: { message: 'User is not a member of the requested tenant.' } }));

    runStory(askTenantMembershipUiLoad(target, tenantId), mocks);

    // Loading clears (the catch's finally) before the error lands, so a view never shows a spinner over a failure.
    expect(dispatched.slice(-2)).toEqual([
      { type: TenantMembershipUiEffect.SetLoading, payload: { isLoading: false } },
      { type: TenantMembershipUiEffect.SetError, payload: { error: 'User is not a member of the requested tenant.' } },
    ]);
    expect(dispatched.some((effect) => effect.type === TenantMembershipUiEffect.SetMembership)).toBe(false);
  });
});
