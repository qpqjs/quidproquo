// A user's role inside a tenant. Owners manage membership (add/remove/update
// members); members merely belong. Finer permissions can be added on the
// membership row later without changing the shape.
export enum TenantMembershipRole {
  owner = 'owner',
  member = 'member',
}
