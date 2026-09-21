import { askKeyValueStoreQueryAll, AskResponse, kvsEqual } from 'quidproquo-core';

import { TENANT_MEMBERSHIPS_STORE } from '../constants/tenantStoreNames';
import { TenantId } from '../models/TenantId';
import { TenantMembership } from '../models/TenantMembership';
import { TenantPermissionRequirement } from '../models/TenantPermissionRequirement';
import { tenantMembershipSatisfies } from './roles/tenantMembershipSatisfies';
import { askTenantRolesConfigRead } from './askTenantRolesConfigRead';

/** Every enabled member of the tenant holding the requirement. Reads all pages; never on a hot path. */
export function* askTenantMembersWithPermission(tenantId: TenantId, requirement: TenantPermissionRequirement): AskResponse<TenantMembership[]> {
  const catalog = yield* askTenantRolesConfigRead();
  const memberships = yield* askKeyValueStoreQueryAll<TenantMembership>(TENANT_MEMBERSHIPS_STORE, kvsEqual('tenantId', tenantId));

  return memberships.filter((membership) => tenantMembershipSatisfies(catalog, membership, requirement));
}
