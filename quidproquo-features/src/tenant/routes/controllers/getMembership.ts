import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocResolveUserId } from '../../../eventDoc/globals/askEventDocResolveUserId';
import { askTenantMembershipGet } from '../../data/askTenantMembershipGet';
import { askTenantIdParse } from '../../logic/askTenantIdParse';
import { askTenantRolesConfigRead } from '../../logic/askTenantRolesConfigRead';
import { tenantMembershipEffectiveGrants } from '../../logic/roles/tenantMembershipEffectiveGrants';
import { tenantMembershipPermissions } from '../../logic/roles/tenantMembershipPermissions';
import { TenantCallerMembership } from '../../models/TenantCallerMembership';

/** GET {basePath}/{id}/membership: the caller's own row plus the permissions it expands to, enabled members only. */
export function* getMembership(event: HTTPEvent, params: { id: string }): AskResponse<HTTPEventResponse> {
  const tenantId = yield* askTenantIdParse(params.id);
  const userId = yield* askEventDocResolveUserId();

  const membership = yield* askTenantMembershipGet(userId, tenantId);
  if (!membership || membership.disabled) {
    return yield* askThrowError(ErrorTypeEnum.Forbidden, 'User is not a member of the requested tenant.');
  }

  const catalog = yield* askTenantRolesConfigRead();
  const response: TenantCallerMembership = {
    ...membership,
    permissions: tenantMembershipPermissions(catalog, membership),
    effectiveGrants: tenantMembershipEffectiveGrants(catalog, membership),
  };

  return qpqWebServerUtils.toJsonEventResponse(response);
}
