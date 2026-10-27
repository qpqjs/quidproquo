import { TenantMembershipUiSetErrorPayload } from '../effects/TenantMembershipUiSetErrorEffect';
import { TenantMembershipUiState } from '../types/TenantMembershipUiState';

export const setError = (state: TenantMembershipUiState, payload: TenantMembershipUiSetErrorPayload): TenantMembershipUiState => ({
  ...state,
  error: payload.error,
});
