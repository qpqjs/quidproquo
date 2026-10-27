import { toQpqPermission } from '../../permission/logic/toQpqPermission';
import { QpqPermissionGroup } from '../../permission/types/QpqPermissionGroup';

/** The permission the inbox routes check. Apps bundle it into roles. */
export const TenantEmailPermission = {
  InboxesManage: toQpqPermission('tenant:email:inboxes:manage'),
} as const satisfies QpqPermissionGroup;
