import { Effect, Nullable } from 'quidproquo-core';

import { TenantMembershipUiEffect } from './TenantMembershipUiEffect';

/** Payload of the SetError effect. */
export type TenantMembershipUiSetErrorPayload = { error: Nullable<string> };

/** Records or clears the last failure. */
export type TenantMembershipUiSetErrorEffect = Effect<TenantMembershipUiEffect.SetError, TenantMembershipUiSetErrorPayload>;
