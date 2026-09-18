import { eventDocPermissions } from '../../../eventDoc/constants/eventDocPermissions';
import { TENANT_ADMIN_ROLE } from '../../constants/tenantAdminRole';
import { TenantPermission } from '../../constants/TenantPermission';
import { TENANT_EVENTDOC_STORE } from '../../constants/tenantStoreNames';
import { TenantRoleDefinition } from '../../models/TenantRoleDefinition';

/** The built-in role: every key the mechanism owns (member management, role assignment) plus the tenant's own document (branding). */
export const buildTenantAdminRole = (): TenantRoleDefinition => ({
  code: TENANT_ADMIN_ROLE,
  name: 'Tenant admin',
  permissions: [...Object.values(TenantPermission), ...Object.values(eventDocPermissions(TENANT_EVENTDOC_STORE))],
});
