import { AskResponse, askThrowError, ErrorTypeEnum, Nullable } from 'quidproquo-core';

import { askTenantReadActiveTenantId } from '../context/askTenantReadActiveTenantId';
import { TenantPermissionRequirement } from '../models/TenantPermissionRequirement';
import { askTenantMemberHasPermission } from './askTenantMemberHasPermission';
import { askTenantResolveUserId } from './askTenantResolveUserId';

/**
 * Refuse unless the CALLER holds the requirement in the ACTIVE tenant. For logic that has
 * loaded its resource and can name the id and kind. `message` replaces the default refusal
 * text; pass null for the default. Throws BadRequest with no active tenant and Unauthorized
 * with no caller: this is a request-time check, never for queue or scheduled work. Custom
 * routes pass their user directory; eventDoc-bridged routes resolve it from their globals.
 */
export function* askTenantAssertPermission(
  requirement: TenantPermissionRequirement,
  message: Nullable<string>,
  userDirectoryName?: string,
): AskResponse<void> {
  const tenantId = yield* askTenantReadActiveTenantId();
  if (!tenantId) {
    return yield* askThrowError(ErrorTypeEnum.BadRequest, 'This operation requires an active tenant.');
  }

  const userId = yield* askTenantResolveUserId(userDirectoryName);

  const allowed = yield* askTenantMemberHasPermission(tenantId, userId, requirement);
  if (!allowed) {
    return yield* askThrowError(ErrorTypeEnum.Forbidden, message ?? `Missing permission: ${requirement.permission}`);
  }
}
