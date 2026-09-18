import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocResolveUserId } from '../../../eventDoc/globals/askEventDocResolveUserId';
import { askTenantRolesConfigRead } from '../../logic/askTenantRolesConfigRead';
import { askTenantValidateMembership } from '../../logic/askTenantValidateMembership';
import { TenantRoleOption } from '../../models/TenantRoleOption';

/** GET {basePath}/{id}/roles: the roles a member of this tenant may be given, as `{ code, name }[]` for pick lists. Members only. */
export function* listRoles(event: HTTPEvent, params: { id: string }): AskResponse<HTTPEventResponse> {
  const userId = yield* askEventDocResolveUserId();

  const isMember = yield* askTenantValidateMembership(userId, params.id);
  if (!isMember) {
    return yield* askThrowError(ErrorTypeEnum.Forbidden, 'User is not a member of the requested tenant.');
  }

  const catalog = yield* askTenantRolesConfigRead();
  const options: TenantRoleOption[] = Object.values(catalog).map(({ code, name }) => ({ code, name }));

  return qpqWebServerUtils.toJsonEventResponse(options);
}
