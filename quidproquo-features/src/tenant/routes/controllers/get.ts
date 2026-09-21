import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocResolveUserId } from '../../../eventDoc/globals/askEventDocResolveUserId';
import { askTenantRecordGet } from '../../data/askTenantRecordGet';
import { askTenantIdParse } from '../../logic/askTenantIdParse';
import { askTenantValidateMembership } from '../../logic/askTenantValidateMembership';

/** GET {basePath}/{id}: one tenant record (fast path), members only. */
export function* get(event: HTTPEvent, params: { id: string }): AskResponse<HTTPEventResponse> {
  const tenantId = yield* askTenantIdParse(params.id);
  const userId = yield* askEventDocResolveUserId();

  const isMember = yield* askTenantValidateMembership(userId, tenantId);
  if (!isMember) {
    return yield* askThrowError(ErrorTypeEnum.Forbidden, 'User is not a member of the requested tenant.');
  }

  const record = yield* askTenantRecordGet(tenantId);
  if (!record) {
    return yield* askThrowError(ErrorTypeEnum.NotFound, `Tenant not found: ${tenantId}`);
  }

  return qpqWebServerUtils.toJsonEventResponse(record);
}
