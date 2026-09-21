import { createInitialTenantMembershipUiState, sharedTenantMembershipUiApi, tenantMembershipUiReducer } from 'quidproquo-features';

import { describe, expect, it } from 'vitest';

import { tenantMembershipRuntime } from './tenantMembershipRuntime';

describe('tenantMembershipRuntime', () => {
  it('binds the membership module under the web-react namespace', () => {
    expect(tenantMembershipRuntime.uniqueName).toBe('qpq/web-react/tenantMembership');
    expect(tenantMembershipRuntime.api).toBe(sharedTenantMembershipUiApi);
    expect(tenantMembershipRuntime.reducer).toBe(tenantMembershipUiReducer);
    expect(tenantMembershipRuntime.initialState).toEqual(createInitialTenantMembershipUiState());
  });
});
