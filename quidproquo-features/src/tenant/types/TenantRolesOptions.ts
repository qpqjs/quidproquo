import { TenantRoleCatalog } from '../models/TenantRoleCatalog';

/** The app's role vocabulary, merged with the built-in tenantAdmin role at config time. */
export type TenantRolesOptions = {
  catalog: TenantRoleCatalog;
};
