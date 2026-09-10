// Reverse membership row (pk = tenantId): every user that belongs to this tenant.
// The mirror of UserTenantLinks - both rows are written together by askTenantLinkMember /
// askTenantUnlinkMember so the two directions never drift.
export type TenantMemberLinks = {
  tenantId: string;
  userIds: string[];
};
