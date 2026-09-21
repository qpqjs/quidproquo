import { askLogCreate, AskResponse, LogLevelEnum } from 'quidproquo-core';

import { askTenantMembershipGet } from '../data/askTenantMembershipGet';
import { TenantId } from '../models/TenantId';
import { TenantPermissionRequirement } from '../models/TenantPermissionRequirement';
import { tenantMembershipSatisfies } from './roles/tenantMembershipSatisfies';
import { tenantRoleCatalogUnknownRoles } from './roles/tenantRoleCatalogUnknownRoles';
import { askTenantRolesConfigRead } from './askTenantRolesConfigRead';

/** Does this user hold the requirement in this tenant? One keyed read plus the pure check. A non-member or disabled member holds nothing. */
export function* askTenantMemberHasPermission(tenantId: TenantId, userId: string, requirement: TenantPermissionRequirement): AskResponse<boolean> {
  const catalog = yield* askTenantRolesConfigRead();
  const membership = yield* askTenantMembershipGet(userId, tenantId);

  // A code the catalog no longer names grants nothing, which is right, but a row that looks
  // provisioned and is not needs a line in the log saying why.
  const unknown = membership ? tenantRoleCatalogUnknownRoles(catalog, membership.roles) : [];
  if (unknown.length > 0) {
    yield* askLogCreate(LogLevelEnum.Warn, `Member holds role code(s) the catalog does not name: ${unknown.join(', ')}`, {
      tenantId,
      userId,
      unknown,
    });
  }

  return tenantMembershipSatisfies(catalog, membership, requirement);
}
