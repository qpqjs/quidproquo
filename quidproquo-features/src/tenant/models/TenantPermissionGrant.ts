import { QpqPermission } from '../../permission/types/QpqPermission';
import { TenantPermissionSelector } from './TenantPermissionSelector';

/** One permission over a set of resources. Roles expand to `all` grants; a narrower selector only ever comes from a direct grant on the membership. */
export type TenantPermissionGrant = {
  permission: QpqPermission;
  selector: TenantPermissionSelector;
};
