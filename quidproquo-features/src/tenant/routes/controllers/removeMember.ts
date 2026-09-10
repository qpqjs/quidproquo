import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocResolveUserId } from '../../../eventDoc/globals/askEventDocResolveUserId';
import { askTenantMemberRemove } from '../../logic/askTenantMemberRemove';
import { askTenantValidateOwner } from '../../logic/askTenantValidateOwner';

/**
 * DELETE {basePath}/{id}/members/{userId}: remove a member from the tenant, OWNERS only.
 * Owners are never removed - demote them first (see askTenantMemberRemove).
 */
export function* removeMember(event: HTTPEvent, params: { id: string; userId: string }): AskResponse<HTTPEventResponse> {
  const callerUserId = yield* askEventDocResolveUserId();

  const isOwner = yield* askTenantValidateOwner(callerUserId, params.id);
  if (!isOwner) {
    return yield* askThrowError(ErrorTypeEnum.Forbidden, 'Only a tenant owner can manage its users.');
  }

  yield* askTenantMemberRemove(params.id, params.userId);

  return qpqWebServerUtils.toJsonEventResponse({ ok: true });
}
