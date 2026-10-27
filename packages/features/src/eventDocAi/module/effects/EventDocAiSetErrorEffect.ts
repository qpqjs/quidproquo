import type { Effect } from 'quidproquo-core';
import type { Nullable } from 'quidproquo-core';

import { EventDocAiEffect } from './EventDocAiEffect';

export type SetErrorPayload = {
  error: Nullable<string>;
};

export type EventDocAiSetErrorEffect = Effect<EventDocAiEffect.SetError, SetErrorPayload>;
