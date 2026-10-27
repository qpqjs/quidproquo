import { Effect } from 'quidproquo-core';

import { TenantMembershipUiEffect } from './TenantMembershipUiEffect';

/** Payload of the SetLoading effect. */
export type TenantMembershipUiSetLoadingPayload = { isLoading: boolean };

/** Marks a fetch in flight. */
export type TenantMembershipUiSetLoadingEffect = Effect<TenantMembershipUiEffect.SetLoading, TenantMembershipUiSetLoadingPayload>;
