import { TenantMembershipUiResetEffect } from './TenantMembershipUiResetEffect';
import { TenantMembershipUiSetErrorEffect } from './TenantMembershipUiSetErrorEffect';
import { TenantMembershipUiSetLoadingEffect } from './TenantMembershipUiSetLoadingEffect';
import { TenantMembershipUiSetMembersEffect } from './TenantMembershipUiSetMembersEffect';
import { TenantMembershipUiSetMembershipEffect } from './TenantMembershipUiSetMembershipEffect';
import { TenantMembershipUiSetRolesEffect } from './TenantMembershipUiSetRolesEffect';

/** Union of the tenant membership module effects. */
export type TenantMembershipUiEffects =
  | TenantMembershipUiSetLoadingEffect
  | TenantMembershipUiSetErrorEffect
  | TenantMembershipUiSetMembershipEffect
  | TenantMembershipUiSetRolesEffect
  | TenantMembershipUiSetMembersEffect
  | TenantMembershipUiResetEffect;
