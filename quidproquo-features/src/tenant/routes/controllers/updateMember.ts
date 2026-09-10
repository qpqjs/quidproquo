import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocResolveUserId } from '../../../eventDoc/globals/askEventDocResolveUserId';
import { askEventDocParseBody } from '../../../eventDoc/routes/askEventDocParseBody';
import { askTenantMemberUpdate } from '../../logic/askTenantMemberUpdate';
import { askTenantValidateOwner } from '../../logic/askTenantValidateOwner';
import { TenantMembershipRole } from '../../models/TenantMembershipRole';
import { TenantMemberUpdateRequest } from '../../models/TenantMemberUpdateRequest';

const roles = new Set<string>(Object.values(TenantMembershipRole));

/**
 * PATCH {basePath}/{id}/members/{userId}: change a member's role and/or disabled flag
 * (body `{ role?, disabled? }`), OWNERS only. The caller cannot demote or disable themself.
 */
export function* updateMember(event: HTTPEvent, params: { id: string; userId: string }): AskResponse<HTTPEventResponse> {
  const callerUserId = yield* askEventDocResolveUserId();

  const isOwner = yield* askTenantValidateOwner(callerUserId, params.id);
  if (!isOwner) {
    return yield* askThrowError(ErrorTypeEnum.Forbidden, 'Only a tenant owner can manage its users.');
  }

  const body = yield* askEventDocParseBody<TenantMemberUpdateRequest>(event);

  if (body.role !== undefined && !roles.has(body.role)) {
    return yield* askThrowError(ErrorTypeEnum.BadRequest, `Unknown role: ${String(body.role)}`);
  }
  if (body.disabled !== undefined && typeof body.disabled !== 'boolean') {
    return yield* askThrowError(ErrorTypeEnum.BadRequest, 'disabled must be a boolean');
  }

  const membership = yield* askTenantMemberUpdate(params.id, callerUserId, params.userId, { role: body.role, disabled: body.disabled });

  return qpqWebServerUtils.toJsonEventResponse(membership);
}
