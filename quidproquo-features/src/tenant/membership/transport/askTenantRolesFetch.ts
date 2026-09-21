import { AskResponse } from 'quidproquo-core';

import { TenantClientTarget } from '../../models/TenantClientTarget';
import { TenantId } from '../../models/TenantId';
import { TenantRoleOption } from '../../models/TenantRoleOption';
import { askTenantApiRequest } from './askTenantApiRequest';

/** GET myTenants/{id}/roles: the role catalog as a pick list. */
export function* askTenantRolesFetch(target: TenantClientTarget, tenantId: TenantId): AskResponse<TenantRoleOption[]> {
  return yield* askTenantApiRequest<void, TenantRoleOption[]>(target, 'GET', `/${tenantId}/roles`);
}
