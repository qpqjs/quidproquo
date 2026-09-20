import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocResolveUserId } from '../../../eventDoc/globals/askEventDocResolveUserId';
import { askTenantLogoDownloadUrl } from '../../data/askTenantLogoDownloadUrl';
import { askTenantRecordGet } from '../../data/askTenantRecordGet';
import { askTenantValidateMembership } from '../../logic/askTenantValidateMembership';
import { composeTenantScope } from '../../logic/storageScope';

/**
 * GET {basePath}/{id}/logo: a presigned URL for the tenant's logo blob, members only. The blob
 * lives in the tenant's own scope, so it is presigned there regardless of the reader's ambient
 * scope: a member browsing their personal partition still gets the logo.
 */
export function* getLogo(event: HTTPEvent, params: { id: string }): AskResponse<HTTPEventResponse> {
  const userId = yield* askEventDocResolveUserId();

  const isMember = yield* askTenantValidateMembership(userId, params.id);
  if (!isMember) {
    return yield* askThrowError(ErrorTypeEnum.Forbidden, 'User is not a member of the requested tenant.');
  }

  const record = yield* askTenantRecordGet(params.id);
  if (!record) {
    return yield* askThrowError(ErrorTypeEnum.NotFound, `Tenant not found: ${params.id}`);
  }

  if (!record.logo) {
    return yield* askThrowError(ErrorTypeEnum.NotFound, `Tenant has no logo: ${params.id}`);
  }

  const result = yield* askTenantLogoDownloadUrl(params.id, record.logo.guid, composeTenantScope(params.id));

  return qpqWebServerUtils.toJsonEventResponse(result);
}
