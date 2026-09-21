import { Nullable } from 'quidproquo-core';

import { TenantCallerMembership } from '../../models/TenantCallerMembership';
import { TenantId } from '../../models/TenantId';
import { TenantMember } from '../../models/TenantMember';
import { TenantRoleOption } from '../../models/TenantRoleOption';

/** The caller's standing in one tenant, plus the roster and role picker for a management screen. */
export type TenantMembershipUiState = {
  tenantId: Nullable<TenantId>;
  membership: Nullable<TenantCallerMembership>;
  roles: TenantRoleOption[];
  members: TenantMember[];
  isLoading: boolean;
  error: Nullable<string>;
};

/** Initial (no tenant selected) state. */
export const createInitialTenantMembershipUiState = (): TenantMembershipUiState => ({
  tenantId: null,
  membership: null,
  roles: [],
  members: [],
  isLoading: false,
  error: null,
});
