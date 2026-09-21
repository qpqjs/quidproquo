import { QpqPermission } from '../../../permission/types/QpqPermission';
import { TenantMembershipUiState } from '../types/TenantMembershipUiState';

/** The flat permission list of the caller's standing; empty until loaded. For nav filtering. */
export const selectTenantMembershipPermissions = (state: TenantMembershipUiState): QpqPermission[] => state.membership?.permissions ?? [];
