import { TenantRoleDefinition } from './TenantRoleDefinition';

/** Every role a tenant may assign, keyed by code. A stored code absent from the catalog grants nothing. */
export type TenantRoleCatalog = Record<string, TenantRoleDefinition>;
