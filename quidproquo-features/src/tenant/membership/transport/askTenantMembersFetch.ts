import { AskResponse, QpqPagedData } from 'quidproquo-core';

import { TenantClientTarget } from '../../models/TenantClientTarget';
import { TenantId } from '../../models/TenantId';
import { TenantMember } from '../../models/TenantMember';
import { askTenantApiRequest } from './askTenantApiRequest';

/** GET myTenants/{id}/members: the whole roster, following pages. */
export function* askTenantMembersFetch(target: TenantClientTarget, tenantId: TenantId): AskResponse<TenantMember[]> {
  const members: TenantMember[] = [];
  let nextPageKey: string | undefined;

  do {
    const query = nextPageKey ? `?nextPageKey=${encodeURIComponent(nextPageKey)}` : '';
    const page = yield* askTenantApiRequest<void, QpqPagedData<TenantMember>>(target, 'GET', `/${tenantId}/members${query}`);

    members.push(...page.items);
    nextPageKey = page.nextPageKey;
  } while (nextPageKey);

  return members;
}
