import { AskResponse } from 'quidproquo-core';

import { EventDocSummary } from '../../../eventDoc/models';
import { TenantClientTarget } from '../../models/TenantClientTarget';
import { askTenantApiRequest } from './askTenantApiRequest';

/** GET myTenants: the caller's tenants. */
export function* askTenantsFetch(target: TenantClientTarget): AskResponse<EventDocSummary[]> {
  return yield* askTenantApiRequest<void, EventDocSummary[]>(target, 'GET', '');
}
