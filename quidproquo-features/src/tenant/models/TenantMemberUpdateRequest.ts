import { TenantMembershipRole } from './TenantMembershipRole';

// Body of PATCH {myTenantsBasePath}/{id}/members/{userId}: the per-member settings an
// owner may change. Omitted fields are left as they are.
export type TenantMemberUpdateRequest = {
  role?: TenantMembershipRole;
  disabled?: boolean;
};
