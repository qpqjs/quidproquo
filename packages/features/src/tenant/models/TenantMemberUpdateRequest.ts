/** Body of PATCH {myTenantsBasePath}/{id}/members/{userId}. Roles have their own route. */
export type TenantMemberUpdateRequest = {
  disabled?: boolean;
};
