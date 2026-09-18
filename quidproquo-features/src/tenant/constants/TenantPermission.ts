import { toQpqPermission } from '../../permission/logic/toQpqPermission';
import { QpqPermissionGroup } from '../../permission/types/QpqPermissionGroup';

/** The two permission keys the membership routes check. Apps bundle them into roles; tenantAdmin holds both. */
export const TenantPermission = {
  MembersManage: toQpqPermission('tenant:members:manage'),
  RolesAssign: toQpqPermission('tenant:roles:assign'),
} as const satisfies QpqPermissionGroup;
