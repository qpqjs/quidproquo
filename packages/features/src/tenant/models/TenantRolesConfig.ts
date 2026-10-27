import { TenantRoleCatalog } from './TenantRoleCatalog';

/** The resolved roles config every service publishes: the merged catalog and the creator seed, both validated. */
export type TenantRolesConfig = {
  catalog: TenantRoleCatalog;
  creatorRoles: string[];
};
