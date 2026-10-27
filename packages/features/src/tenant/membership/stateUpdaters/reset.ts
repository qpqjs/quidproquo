import { createInitialTenantMembershipUiState, TenantMembershipUiState } from '../types/TenantMembershipUiState';

export const reset = (_state: TenantMembershipUiState): TenantMembershipUiState => createInitialTenantMembershipUiState();
