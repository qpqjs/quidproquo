import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocResolveUserId } from '../../../eventDoc/globals/askEventDocResolveUserId';
import { askTenantIdParse } from '../../logic/askTenantIdParse';
import { askTenantRolesConfigRead } from '../../logic/askTenantRolesConfigRead';
import { askTenantValidateMembership } from '../../logic/askTenantValidateMembership';
import { TenantRoleOption } from '../../models/TenantRoleOption';

/** GET {basePath}/{id}/roles: the roles a member of this tenant may be given, as `{ code, name }[]` for pick lists. Members only. */
export function* listRoles(event: HTTPEvent, params: { id: string }): AskResponse<HTTPEventResponse> {
  const tenantId = yield* askTenantIdParse(params.id);
  const userId = yield* askEventDocResolveUserId();

  const isMember = yield* askTenantValidateMembership(userId, tenantId);
  if (!isMember) {
    return yield* askThrowError(ErrorTypeEnum.Forbidden, 'User is not a member of the requested tenant.');
  }

  const { catalog } = yield* askTenantRolesConfigRead();
  const options: TenantRoleOption[] = Object.values(catalog).map(({ code, name, description }) => ({ code, name, description }));

  return qpqWebServerUtils.toJsonEventResponse(options);
}
