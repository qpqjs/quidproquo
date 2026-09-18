import { Nullable } from 'quidproquo-core';

import { QpqPermission } from '../../../permission/types/QpqPermission';
import { TenantPermissionRequirement } from '../../models/TenantPermissionRequirement';

/** A requirement for a key; with no resource it is tenant-wide, which only an `all` grant satisfies. */
export const buildTenantPermissionRequirement = (
  permission: QpqPermission,
  resourceId: string = '',
  resourceKind: Nullable<string> = null,
): TenantPermissionRequirement => ({ permission, resourceId, resourceKind });
