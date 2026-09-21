/** Effect types on the tenant membership module. */
export enum TenantMembershipUiEffect {
  SetLoading = 'tenantMembershipSetLoading',
  SetError = 'tenantMembershipSetError',
  SetMembership = 'tenantMembershipSetMembership',
  SetRoles = 'tenantMembershipSetRoles',
  SetMembers = 'tenantMembershipSetMembers',
  Reset = 'tenantMembershipReset',
}
