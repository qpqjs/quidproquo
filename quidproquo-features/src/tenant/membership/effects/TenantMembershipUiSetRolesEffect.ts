import { Effect } from 'quidproquo-core';

import { TenantRoleOption } from '../../models/TenantRoleOption';
import { TenantMembershipUiEffect } from './TenantMembershipUiEffect';

/** Payload of the SetRoles effect. */
export type TenantMembershipUiSetRolesPayload = { roles: TenantRoleOption[] };

/** Stores the role picker. */
export type TenantMembershipUiSetRolesEffect = Effect<TenantMembershipUiEffect.SetRoles, TenantMembershipUiSetRolesPayload>;
