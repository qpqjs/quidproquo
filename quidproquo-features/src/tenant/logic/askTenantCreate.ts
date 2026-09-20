import { askNewGuid, AskResponse, askStorageScopeProvide } from 'quidproquo-core';

import { askEventDocCreate } from '../../eventDoc/logic/askEventDocCreate';
import { askEventDocGenerateNewId } from '../../eventDoc/logic/askEventDocGenerateNewId';
import { EventDocEventActor, EventDocSummary } from '../../eventDoc/models';
import { TENANT_ADMIN_ROLE } from '../constants/tenantAdminRole';
import { askTenantLinkMember } from './askTenantLinkMember';
import { composeTenantScope } from './storageScope';

/**
 * Create the tenant eventDoc under ITS OWN scope (TENANT#<id>) and link the creator as its first
 * admin. Nothing owns a tenant but itself: any member with the right permission edits it from
 * inside, and the creator leaving changes nothing. Must run under the tenant eventDoc store
 * context (the tenant routes provide it).
 */
export function* askTenantCreate(name: string, actor: EventDocEventActor): AskResponse<EventDocSummary> {
  const tenantId = yield* askEventDocGenerateNewId();
  // Non-user-facing unique filler required by the eventDoc INIT contract.
  const code = yield* askNewGuid();

  const summary = yield* askStorageScopeProvide(composeTenantScope(tenantId), askEventDocCreate(name, code, actor, tenantId));

  yield* askTenantLinkMember(summary.id, actor.userId, [TENANT_ADMIN_ROLE], actor.userId);

  return summary;
}
