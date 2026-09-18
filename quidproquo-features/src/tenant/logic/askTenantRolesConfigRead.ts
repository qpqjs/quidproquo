import { askConfigGetGlobal, AskResponse } from 'quidproquo-core';

import { TENANT_ROLES_GLOBAL } from '../constants/tenantGlobalNames';
import { TenantRoleCatalog } from '../models/TenantRoleCatalog';

/** The merged role catalog defineTenant published for this service. */
export function* askTenantRolesConfigRead(): AskResponse<TenantRoleCatalog> {
  return yield* askConfigGetGlobal<TenantRoleCatalog>(TENANT_ROLES_GLOBAL);
}
