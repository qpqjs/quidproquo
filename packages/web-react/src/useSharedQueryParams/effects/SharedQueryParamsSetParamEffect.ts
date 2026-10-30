import { Effect } from '@qpqjs/core';

import { SharedQueryParamsEffect } from './SharedQueryParamsEffect';

export type SharedQueryParamsSetParamPayload = { key: string; values: string[] };

export type SharedQueryParamsSetParamEffect = Effect<SharedQueryParamsEffect.SetParam, SharedQueryParamsSetParamPayload>;
