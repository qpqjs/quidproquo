import { askUITenantMembershipReset } from './actionCreators/askUITenantMembershipReset';
import { askTenantMembershipUiAddMember } from './logic/askTenantMembershipUiAddMember';
import { askTenantMembershipUiLoad } from './logic/askTenantMembershipUiLoad';
import { askTenantMembershipUiLoadMembers } from './logic/askTenantMembershipUiLoadMembers';
import { askTenantMembershipUiRemoveMember } from './logic/askTenantMembershipUiRemoveMember';
import { askTenantMembershipUiSetMemberDisabled } from './logic/askTenantMembershipUiSetMemberDisabled';
import { askTenantMembershipUiSetMemberRoles } from './logic/askTenantMembershipUiSetMemberRoles';

/** The tenant membership module's verbs. A host supplies its TenantClientTarget on each call. */
export const sharedTenantMembershipUiApi = {
  askTenantMembershipUiLoad,
  askTenantMembershipUiLoadMembers,
  askTenantMembershipUiSetMemberRoles,
  askTenantMembershipUiAddMember,
  askTenantMembershipUiSetMemberDisabled,
  askTenantMembershipUiRemoveMember,
  askUITenantMembershipReset,
};
