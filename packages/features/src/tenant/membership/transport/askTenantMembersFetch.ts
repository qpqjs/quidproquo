import { askPagedDataDrain, AskResponse, QpqPagedData } from '@qpqjs/core';

import { TenantClientTarget } from '../../models/TenantClientTarget';
import { TenantId } from '../../models/TenantId';
import { TenantMember } from '../../models/TenantMember';
import { askTenantApiRequest } from './askTenantApiRequest';

/** GET myTenants/{id}/members: the whole roster, following pages. */
export function* askTenantMembersFetch(target: TenantClientTarget, tenantId: TenantId): AskResponse<TenantMember[]> {
  const { items } = yield* askPagedDataDrain(function* askMembersPage(nextPageKey) {
    const query = nextPageKey ? `?nextPageKey=${encodeURIComponent(nextPageKey)}` : '';

    return yield* askTenantApiRequest<QpqPagedData<TenantMember>, void>(target, 'GET', `/${tenantId}/members${query}`);
  });

  return items;
}
