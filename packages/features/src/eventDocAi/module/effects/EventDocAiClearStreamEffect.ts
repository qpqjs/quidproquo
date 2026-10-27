import type { Effect } from '@qpqjs/core';

import { EventDocAiEffect } from './EventDocAiEffect';

export type ClearStreamPayload = Record<string, never>;

export type EventDocAiClearStreamEffect = Effect<EventDocAiEffect.ClearStream, ClearStreamPayload>;
