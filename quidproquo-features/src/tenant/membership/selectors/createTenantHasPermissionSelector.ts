import { Nullable } from 'quidproquo-core';

import { QpqPermission } from '../../../permission/types/QpqPermission';
import { buildTenantPermissionRequirement } from '../../logic/roles/buildTenantPermissionRequirement';
import { tenantPermissionGrantSatisfies } from '../../logic/roles/tenantPermissionGrantSatisfies';
import { TenantMembershipUiState } from '../types/TenantMembershipUiState';

/**
 * Whether the caller holds a permission, optionally on a resource, judged by the same function
 * the server uses over the effective grants it returned. False until loaded. For hiding controls
 * only; the server still checks.
 */
export const createTenantHasPermissionSelector =
  (permission: QpqPermission, resourceId: string = '', resourceKind: Nullable<string> = null) =>
  (state: TenantMembershipUiState): boolean =>
    !!state.membership &&
    tenantPermissionGrantSatisfies(state.membership.effectiveGrants, buildTenantPermissionRequirement(permission, resourceId, resourceKind));
