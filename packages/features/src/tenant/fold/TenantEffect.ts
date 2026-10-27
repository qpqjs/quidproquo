import { Effect } from 'quidproquo-core';

import { EventDocEventPayload } from '../../eventDoc/models';
import { TenantSetBrandData } from '../models/TenantSetBrandData';

export enum TenantEffect {
  setBrand = 'SET_BRAND',
}

export type SetBrandEffect = Effect<TenantEffect.setBrand, EventDocEventPayload<TenantSetBrandData>>;

export type TenantEffects = SetBrandEffect;
