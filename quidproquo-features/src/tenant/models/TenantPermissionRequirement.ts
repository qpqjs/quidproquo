import { Nullable } from 'quidproquo-core';

import { QpqPermission } from '../../permission/types/QpqPermission';

/**
 * What an operation demands. `resourceId` is '' for an operation with no resource (a create,
 * a tenant-wide setting), which only an `all` selector satisfies. `resourceKind` is null unless
 * the caller has loaded the resource and knows its kind; a route never can.
 */
export type TenantPermissionRequirement = {
  permission: QpqPermission;
  resourceId: string;
  resourceKind: Nullable<string>;
};
