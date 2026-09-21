import { AskResponse } from 'quidproquo-core';

import { TenantClientTarget } from '../../models/TenantClientTarget';
import { TenantId } from '../../models/TenantId';
import { TenantMember } from '../../models/TenantMember';
import { TenantMemberAddRequest } from '../../models/TenantMemberAddRequest';
import { askTenantApiRequest } from './askTenantApiRequest';

/** POST myTenants/{id}/members: add an existing account by email. */
export function* askTenantMemberAddPost(target: TenantClientTarget, tenantId: TenantId, email: string): AskResponse<TenantMember> {
  return yield* askTenantApiRequest<TenantMemberAddRequest, TenantMember>(target, 'POST', `/${tenantId}/members`, { email });
}
