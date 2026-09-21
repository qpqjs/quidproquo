import { Effect } from 'quidproquo-core';

import { TenantMember } from '../../models/TenantMember';
import { TenantMembershipUiEffect } from './TenantMembershipUiEffect';

/** Payload of the SetMembers effect. */
export type TenantMembershipUiSetMembersPayload = { members: TenantMember[] };

/** Stores the roster. */
export type TenantMembershipUiSetMembersEffect = Effect<TenantMembershipUiEffect.SetMembers, TenantMembershipUiSetMembersPayload>;
