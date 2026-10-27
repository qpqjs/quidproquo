import { Effect } from '@qpqjs/core';

import { TenantMembershipUiEffect } from './TenantMembershipUiEffect';

/** Payload of the Reset effect. */
export type TenantMembershipUiResetPayload = undefined;

/** Clears everything (tenant deselected). */
export type TenantMembershipUiResetEffect = Effect<TenantMembershipUiEffect.Reset, TenantMembershipUiResetPayload>;
