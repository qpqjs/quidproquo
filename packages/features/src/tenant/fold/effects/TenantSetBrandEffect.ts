import { Effect } from '@qpqjs/core';

import { TenantSetBrandData } from '../../models/TenantSetBrandData';
import { TenantEffect } from './TenantEffect';

/** Replaces the tenant's branding; always carries the full brand payload (see askTenantSetBrand). */
export type TenantSetBrandEffect = Effect<TenantEffect.SetBrand, TenantSetBrandData>;
