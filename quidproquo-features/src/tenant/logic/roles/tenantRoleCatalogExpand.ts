import { QpqPermission } from '../../../permission/types/QpqPermission';
import { TenantPermissionGrant } from '../../models/TenantPermissionGrant';
import { TenantRoleCatalog } from '../../models/TenantRoleCatalog';

/** Expand role codes into `all` grants against the catalog. Codes absent from the catalog expand to nothing; duplicates collapse. */
export const tenantRoleCatalogExpand = (catalog: TenantRoleCatalog, roles: string[]): TenantPermissionGrant[] => {
  const permissions = new Set<QpqPermission>();

  for (const role of roles) {
    for (const permission of catalog[role]?.permissions ?? []) {
      permissions.add(permission);
    }
  }

  return [...permissions].map((permission): TenantPermissionGrant => ({ permission, selector: { kind: 'all' } }));
};
