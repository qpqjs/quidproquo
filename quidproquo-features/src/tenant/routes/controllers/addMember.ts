import { askConfigGetGlobal, AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { EVENT_DOC_USER_DIRECTORY_GLOBAL } from '../../../eventDoc/constants/eventDocGlobalNames';
import { askEventDocResolveUserId } from '../../../eventDoc/globals/askEventDocResolveUserId';
import { askEventDocParseBody } from '../../../eventDoc/routes/askEventDocParseBody';
import { askTenantMemberAdd } from '../../logic/askTenantMemberAdd';
import { askTenantValidateOwner } from '../../logic/askTenantValidateOwner';
import { TenantMemberAddRequest } from '../../models/TenantMemberAddRequest';

/**
 * POST {basePath}/{id}/members: add an existing user (body `{ email }`) to the tenant as a
 * member, OWNERS only. NotFound when no account has that email - there is no invite flow.
 */
export function* addMember(event: HTTPEvent, params: { id: string }): AskResponse<HTTPEventResponse> {
  const userId = yield* askEventDocResolveUserId();

  const isOwner = yield* askTenantValidateOwner(userId, params.id);
  if (!isOwner) {
    return yield* askThrowError(ErrorTypeEnum.Forbidden, 'Only a tenant owner can manage its users.');
  }

  const { email } = yield* askEventDocParseBody<TenantMemberAddRequest>(event);
  if (typeof email !== 'string') {
    return yield* askThrowError(ErrorTypeEnum.BadRequest, 'An email address is required.');
  }

  const userDirectoryName = yield* askConfigGetGlobal<string>(EVENT_DOC_USER_DIRECTORY_GLOBAL);
  const member = yield* askTenantMemberAdd(userDirectoryName, params.id, email, userId);

  return qpqWebServerUtils.toJsonEventResponse(member);
}
