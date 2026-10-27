import type { Effect } from 'quidproquo-core';

import { EventDocAiEffect } from './EventDocAiEffect';

export type ClearStreamPayload = Record<string, never>;

export type EventDocAiClearStreamEffect = Effect<EventDocAiEffect.ClearStream, ClearStreamPayload>;
