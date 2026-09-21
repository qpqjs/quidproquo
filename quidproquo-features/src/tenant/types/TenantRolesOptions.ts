import { TenantRoleCatalog } from '../models/TenantRoleCatalog';

/** The app's role vocabulary, merged with the built-in tenantAdmin role at config time. */
export type TenantRolesOptions = {
  catalog?: TenantRoleCatalog;
  // What a tenant's creator starts with. Defaults to [tenantAdmin]; must name at least one role holding tenant:roles:assign.
  creatorRoles?: string[];
};
