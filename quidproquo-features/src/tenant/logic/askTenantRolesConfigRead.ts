import { askConfigGetGlobal, AskResponse } from 'quidproquo-core';

import { TENANT_ROLES_GLOBAL } from '../constants/tenantGlobalNames';
import { TenantRolesConfig } from '../models/TenantRolesConfig';

/** The roles config defineTenant published for this service: the merged catalog and the creator seed. */
export function* askTenantRolesConfigRead(): AskResponse<TenantRolesConfig> {
  return yield* askConfigGetGlobal<TenantRolesConfig>(TENANT_ROLES_GLOBAL);
}
