import { Nullable, QpqIsoDateTime } from 'quidproquo-core';

import { TenantMembershipRole } from './TenantMembershipRole';

// A tenant member as the management UI lists it: the membership row hydrated with
// the user directory's email + display name (null when the directory no longer
// knows the user, e.g. a deleted account whose row was never cleaned up).
export type TenantMember = {
  userId: string;
  email: Nullable<string>;
  name: Nullable<string>;
  role: TenantMembershipRole;
  disabled: boolean;
  joinedAt: QpqIsoDateTime;
};
