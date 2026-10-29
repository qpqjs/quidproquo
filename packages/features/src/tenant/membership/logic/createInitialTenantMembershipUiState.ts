import { TenantMembershipUiState } from '../types/TenantMembershipUiState';

/** Initial (no tenant selected) state. */
export const createInitialTenantMembershipUiState = (): TenantMembershipUiState => ({
  tenantId: null,
  membership: null,
  roles: [],
  members: [],
  isLoading: false,
  error: null,
});
