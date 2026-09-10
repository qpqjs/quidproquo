import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocProvideRequestScope } from '../../../eventDoc/globals/askEventDocProvideRequestScope';
import { askEventDocProvideStoreFromGlobals } from '../../../eventDoc/globals/askEventDocProvideStoreFromGlobals';
import { askEventDocResolveUserId } from '../../../eventDoc/globals/askEventDocResolveUserId';
import { askTenantMemberRemove } from '../../logic/askTenantMemberRemove';
import { askTenantValidateOwner } from '../../logic/askTenantValidateOwner';

function* askTenantRouteRemoveMember(event: HTTPEvent, params: { id: string; userId: string }): AskResponse<HTTPEventResponse> {
  const callerUserId = yield* askEventDocResolveUserId();

  const isOwner = yield* askTenantValidateOwner(callerUserId, params.id);
  if (!isOwner) {
    return yield* askThrowError(ErrorTypeEnum.Forbidden, "Only the tenant's owner can manage its users.");
  }

  yield* askTenantMemberRemove(params.id, params.userId);

  return qpqWebServerUtils.toJsonEventResponse({ ok: true });
}

/**
 * DELETE {basePath}/{id}/members/{userId}: remove a member from the tenant, OWNER only.
 * The owner can never be removed (see askTenantMemberRemove).
 */
export function* removeMember(event: HTTPEvent, params: { id: string; userId: string }): AskResponse<HTTPEventResponse> {
  return yield* askEventDocProvideStoreFromGlobals(askEventDocProvideRequestScope(event, askTenantRouteRemoveMember(event, params)));
}
