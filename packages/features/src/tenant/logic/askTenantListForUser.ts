import { askMapParallel, AskResponse, askStorageScopeProvide, Nullable } from 'quidproquo-core';

import { askEventDocGetById } from '../../eventDoc/data/askEventDocGetById';
import { EventDocSummary } from '../../eventDoc/models';
import { askTenantMembershipsForUser } from '../data/askTenantMembershipsForUser';
import { composeTenantScope } from './storageScope';

/**
 * List-my-tenants: each enabled membership's live summary, read from that tenant's own scope
 * (drafts included, so a never-published tenant can be reopened to finish setup; soft-deleted
 * ones drop out). This is the one deliberate cross-scope doc read, and it is gated by the
 * membership row that named the tenant. Requires the tenant eventDoc store context.
 */
export function* askTenantListForUser(userId: string): AskResponse<EventDocSummary[]> {
  const memberships = yield* askTenantMembershipsForUser(userId);
  const tenantIds = memberships.filter((membership) => !membership.disabled).map((membership) => membership.tenantId);

  const summaries = yield* askMapParallel(tenantIds, function* askHydrateTenant(tenantId): AskResponse<Nullable<EventDocSummary>> {
    const summary = yield* askStorageScopeProvide(composeTenantScope(tenantId), askEventDocGetById(tenantId));

    return summary && !summary.deletedAt ? summary : null;
  });

  return summaries.filter((summary): summary is EventDocSummary => summary !== null);
}
