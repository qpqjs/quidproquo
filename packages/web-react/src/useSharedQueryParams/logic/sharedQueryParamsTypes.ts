import { Effect } from 'quidproquo-core';

export type SharedQueryParamsState = Record<string, string[] | undefined>;

export enum SharedQueryParamsEffect {
  SetParam = 'Qpq/SharedQueryParams/SetParam',
}

export type SharedQueryParamsSetParamEffect = Effect<SharedQueryParamsEffect.SetParam, { key: string; values: string[] }>;
export type SharedQueryParamsEffects = SharedQueryParamsSetParamEffect;
