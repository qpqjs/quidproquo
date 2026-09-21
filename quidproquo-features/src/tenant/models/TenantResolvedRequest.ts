import { Nullable } from 'quidproquo-core';

import { TenantId } from './TenantId';
import { TenantMembership } from './TenantMembership';

/** A tenant-aware request once gated: its typed scope, the caller, and (under a tenant) the caller's enabled membership row. */
export type TenantResolvedRequest = {
  scope: string;
  userId: string;
  tenantId: Nullable<TenantId>;
  membership: Nullable<TenantMembership>;
};
