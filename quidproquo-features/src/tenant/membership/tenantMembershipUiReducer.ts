import { buildEffectReducer } from 'quidproquo-core';

import { TenantMembershipUiEffect } from './effects/TenantMembershipUiEffect';
import type { TenantMembershipUiEffects } from './effects/TenantMembershipUiEffects';
import { reset } from './stateUpdaters/reset';
import { setError } from './stateUpdaters/setError';
import { setLoading } from './stateUpdaters/setLoading';
import { setMembers } from './stateUpdaters/setMembers';
import { setMembership } from './stateUpdaters/setMembership';
import { setRoles } from './stateUpdaters/setRoles';
import type { TenantMembershipUiState } from './types/TenantMembershipUiState';

/** Reducer for the tenant membership module. */
export const tenantMembershipUiReducer = buildEffectReducer<TenantMembershipUiState, TenantMembershipUiEffects>({
  [TenantMembershipUiEffect.SetLoading]: setLoading,
  [TenantMembershipUiEffect.SetError]: setError,
  [TenantMembershipUiEffect.SetMembership]: setMembership,
  [TenantMembershipUiEffect.SetRoles]: setRoles,
  [TenantMembershipUiEffect.SetMembers]: setMembers,
  [TenantMembershipUiEffect.Reset]: reset,
});
