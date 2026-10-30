import { AskResponse } from '@qpqjs/core';

import { TenantCallerMembership } from '../../models/TenantCallerMembership';
import { TenantClientTarget } from '../../models/TenantClientTarget';
import { TenantId } from '../../models/TenantId';
import { askTenantApiRequest } from './askTenantApiRequest';

/** GET myTenants/{id}/membership: the caller's row with its expanded permissions and grants. */
export function* askTenantMembershipFetch(target: TenantClientTarget, tenantId: TenantId): AskResponse<TenantCallerMembership> {
  return yield* askTenantApiRequest<TenantCallerMembership, void>(target, 'GET', `/${tenantId}/membership`);
}
