import { askConfigGetGlobal, AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { EVENT_DOC_USER_DIRECTORY_GLOBAL } from '../../../eventDoc/constants/eventDocGlobalNames';
import { askEventDocResolveUserId } from '../../../eventDoc/globals/askEventDocResolveUserId';
import { askTenantMemberList } from '../../logic/askTenantMemberList';
import { askTenantValidateMembership } from '../../logic/askTenantValidateMembership';

/** GET {basePath}/{id}/members: the tenant's members (userId + email + name), members only. */
export function* listMembers(event: HTTPEvent, params: { id: string }): AskResponse<HTTPEventResponse> {
  const userId = yield* askEventDocResolveUserId();

  const isMember = yield* askTenantValidateMembership(userId, params.id);
  if (!isMember) {
    return yield* askThrowError(ErrorTypeEnum.Forbidden, 'User is not a member of the requested tenant.');
  }

  const userDirectoryName = yield* askConfigGetGlobal<string>(EVENT_DOC_USER_DIRECTORY_GLOBAL);
  const members = yield* askTenantMemberList(userDirectoryName, params.id);

  return qpqWebServerUtils.toJsonEventResponse(members);
}
