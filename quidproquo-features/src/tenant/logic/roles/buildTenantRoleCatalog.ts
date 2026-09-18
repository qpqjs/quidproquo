import { TENANT_ADMIN_ROLE } from '../../constants/tenantAdminRole';
import { TenantRoleCatalog } from '../../models/TenantRoleCatalog';
import { buildTenantAdminRole } from './buildTenantAdminRole';

/** The catalog every service publishes: the app's roles plus tenantAdmin. Throws if the app reuses the reserved code or a role's code disagrees with its key. */
export const buildTenantRoleCatalog = (appCatalog: TenantRoleCatalog = {}): TenantRoleCatalog => {
  if (appCatalog[TENANT_ADMIN_ROLE]) {
    throw new Error(`Tenant role code '${TENANT_ADMIN_ROLE}' is reserved for the built-in admin role.`);
  }

  for (const [code, role] of Object.entries(appCatalog)) {
    if (role.code !== code) {
      throw new Error(`Tenant role '${code}' declares a different code: '${role.code}'.`);
    }
  }

  return { ...appCatalog, [TENANT_ADMIN_ROLE]: buildTenantAdminRole() };
};
