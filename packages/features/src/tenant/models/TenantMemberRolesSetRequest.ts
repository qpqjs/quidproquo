import { TenantPermissionGrant } from './TenantPermissionGrant';

/** Body of PUT {myTenantsBasePath}/{id}/members/{userId}/roles: the member's whole new assignment. */
export type TenantMemberRolesSetRequest = {
  roles: string[];
  grants: TenantPermissionGrant[];
};
