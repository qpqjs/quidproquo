import { createInitialTenantMembershipUiState } from '../logic/createInitialTenantMembershipUiState';
import { TenantMembershipUiState } from '../types/TenantMembershipUiState';

export const reset = (_state: TenantMembershipUiState): TenantMembershipUiState => createInitialTenantMembershipUiState();
