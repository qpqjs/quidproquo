import { AskResponse } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocResolveUserId } from '../../../eventDoc/globals/askEventDocResolveUserId';
import { askEventDocParseBody } from '../../../eventDoc/routes/askEventDocParseBody';
import { askValidateModelOrThrowError } from '../../../validation/askValidateModelOrThrowError';
import { askTenantIdParse } from '../../logic/askTenantIdParse';
import { askTenantMemberRolesSet } from '../../logic/askTenantMemberRolesSet';
import { TenantMemberRolesSetRequest } from '../../models/TenantMemberRolesSetRequest';
import { tenantMemberRolesSetRequestSchema } from '../tenantMemberRolesSetRequestSchema';

/** PUT {basePath}/{id}/members/{userId}/roles: replace a member's roles and grants (body `{ roles, grants }`). Needs RolesAssign. */
export function* setMemberRoles(event: HTTPEvent, params: { id: string; userId: string }): AskResponse<HTTPEventResponse> {
  const tenantId = yield* askTenantIdParse(params.id);
  const callerUserId = yield* askEventDocResolveUserId();

  const body = yield* askEventDocParseBody<TenantMemberRolesSetRequest>(event);
  const { roles, grants } = yield* askValidateModelOrThrowError(body, tenantMemberRolesSetRequestSchema);

  const membership = yield* askTenantMemberRolesSet(tenantId, params.userId, roles, grants, callerUserId);

  return qpqWebServerUtils.toJsonEventResponse(membership);
}
