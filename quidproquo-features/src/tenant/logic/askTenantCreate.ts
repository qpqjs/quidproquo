import { askNewGuid, AskResponse } from 'quidproquo-core';

import { askEventDocCreate } from '../../eventDoc/logic/askEventDocCreate';
import { EventDocEventActor, EventDocSummary } from '../../eventDoc/models';
import { TenantMembershipRole } from '../models/TenantMembershipRole';
import { askTenantLinkMember } from './askTenantLinkMember';

// Create the tenant eventDoc and link the creator as its first OWNER. Must run
// under the tenant eventDoc store context (the tenant routes provide it).
export function* askTenantCreate(name: string, actor: EventDocEventActor): AskResponse<EventDocSummary> {
  // Tenant identity is the opaque doc id; code is a non-user-facing unique
  // filler required by the eventDoc INIT contract.
  const code = yield* askNewGuid();
  const summary = yield* askEventDocCreate(name, code, actor);

  yield* askTenantLinkMember(summary.id, actor.userId, TenantMembershipRole.owner, actor.userId);

  return summary;
}
