// Body of POST {myTenantsBasePath}/{id}/members: the email of an EXISTING user
// directory account to add as a member (there is no invite flow yet).
export type TenantMemberAddRequest = {
  email: string;
};
