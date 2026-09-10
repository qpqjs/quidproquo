import { QpqIsoDateTime } from 'quidproquo-core';

import { TenantMembershipRole } from './TenantMembershipRole';

// THE "this user inside this tenant" record: one row per link, stored identically
// in both membership stores (see tenantStoreNames). Everything per-user-per-tenant
// lives here - the role, a disabled switch (keeps the row, blocks access), and
// how the link came to be.
export type TenantMembership = {
  tenantId: string;
  userId: string;
  role: TenantMembershipRole;
  // A disabled member fails the membership check everywhere (scope resolver,
  // websocket scope, the tenant routes) but still lists, so an owner can re-enable.
  disabled?: boolean;
  joinedAt: QpqIsoDateTime;
  addedByUserId: string;
};
