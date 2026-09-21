import { askNewGuid, AskResponse, askStorageScopeProvide } from 'quidproquo-core';

import { askEventDocCreate } from '../../eventDoc/logic/askEventDocCreate';
import { EventDocEventActor, EventDocSummary } from '../../eventDoc/models';
import { askTenantGenerateNewId } from './askTenantGenerateNewId';
import { askTenantLinkMember } from './askTenantLinkMember';
import { askTenantRolesConfigRead } from './askTenantRolesConfigRead';
import { composeTenantScope } from './storageScope';

/**
 * Create the tenant eventDoc under ITS OWN scope (TENANT#<id>) and link the creator with the
 * configured creator roles (tenantAdmin by default). Nothing owns a tenant but itself: any member with the right permission edits it from
 * inside, and the creator leaving changes nothing. Must run under the tenant eventDoc store
 * context (the tenant routes provide it).
 */
export function* askTenantCreate(name: string, actor: EventDocEventActor): AskResponse<EventDocSummary> {
  const tenantId = yield* askTenantGenerateNewId();
  // Non-user-facing unique filler required by the eventDoc INIT contract.
  const code = yield* askNewGuid();

  const summary = yield* askStorageScopeProvide(composeTenantScope(tenantId), askEventDocCreate(name, code, actor, tenantId));

  const { creatorRoles } = yield* askTenantRolesConfigRead();
  yield* askTenantLinkMember(tenantId, actor.userId, creatorRoles, actor.userId);

  return summary;
}
