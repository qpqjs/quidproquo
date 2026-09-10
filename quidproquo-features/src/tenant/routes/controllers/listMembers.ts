import { askConfigGetGlobal, AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { EVENT_DOC_USER_DIRECTORY_GLOBAL } from '../../../eventDoc/constants/eventDocGlobalNames';
import { askEventDocResolveUserId } from '../../../eventDoc/globals/askEventDocResolveUserId';
import { askTenantMemberList } from '../../logic/askTenantMemberList';
import { askTenantValidateMembership } from '../../logic/askTenantValidateMembership';

const DEFAULT_PAGE_SIZE = 100;

/**
 * GET {basePath}/{id}/members: a page of the tenant's members (userId + email + name +
 * role + disabled), members only. Query `limit` and `nextPageKey` page through.
 */
export function* listMembers(event: HTTPEvent, params: { id: string }): AskResponse<HTTPEventResponse> {
  const userId = yield* askEventDocResolveUserId();

  const isMember = yield* askTenantValidateMembership(userId, params.id);
  if (!isMember) {
    return yield* askThrowError(ErrorTypeEnum.Forbidden, 'User is not a member of the requested tenant.');
  }

  const limit = Number(event.query?.limit) || DEFAULT_PAGE_SIZE;
  const nextPageKey = typeof event.query?.nextPageKey === 'string' ? event.query.nextPageKey : undefined;

  const userDirectoryName = yield* askConfigGetGlobal<string>(EVENT_DOC_USER_DIRECTORY_GLOBAL);
  const page = yield* askTenantMemberList(userDirectoryName, params.id, limit, nextPageKey);

  return qpqWebServerUtils.toJsonEventResponse(page);
}
