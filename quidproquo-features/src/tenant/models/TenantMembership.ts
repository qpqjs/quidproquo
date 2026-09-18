import { QpqIsoDateTime } from 'quidproquo-core';

import { TenantPermissionGrant } from './TenantPermissionGrant';

/**
 * THE "this user inside this tenant" record, one row per link. Authority lives here and
 * nowhere else: roles are catalog codes expanded at read time (never denormalised, so a
 * catalog change takes effect everywhere at once), grants are the direct exceptions. A
 * disabled member fails the membership check everywhere but still lists, so an admin can
 * re-enable.
 */
export type TenantMembership = {
  tenantId: string;
  userId: string;
  roles: string[];
  grants: TenantPermissionGrant[];
  disabled?: boolean;
  joinedAt: QpqIsoDateTime;
  addedByUserId: string;
  rolesUpdatedAt: QpqIsoDateTime;
  rolesUpdatedByUserId: string;
};
