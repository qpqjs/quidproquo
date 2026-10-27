import type { Effect } from '@qpqjs/core';
import type { Nullable } from '@qpqjs/core';

import { EventDocAiEffect } from './EventDocAiEffect';

export type SetErrorPayload = {
  error: Nullable<string>;
};

export type EventDocAiSetErrorEffect = Effect<EventDocAiEffect.SetError, SetErrorPayload>;
