import { Nullable } from 'quidproquo-core';

import { TenantMembership } from './TenantMembership';

/** A tenant-aware request once gated: its typed scope, the caller, and (under a tenant) the caller's enabled membership row. */
export type TenantResolvedRequest = {
  scope: string;
  userId: string;
  tenantId: Nullable<string>;
  membership: Nullable<TenantMembership>;
};
