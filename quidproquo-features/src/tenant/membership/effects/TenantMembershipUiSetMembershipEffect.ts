import { Effect } from 'quidproquo-core';

import { TenantCallerMembership } from '../../models/TenantCallerMembership';
import { TenantId } from '../../models/TenantId';
import { TenantMembershipUiEffect } from './TenantMembershipUiEffect';

/** Payload of the SetMembership effect. */
export type TenantMembershipUiSetMembershipPayload = { tenantId: TenantId; membership: TenantCallerMembership };

/** Stores the caller's standing in the selected tenant. */
export type TenantMembershipUiSetMembershipEffect = Effect<TenantMembershipUiEffect.SetMembership, TenantMembershipUiSetMembershipPayload>;
