import type { Effect } from '@qpqjs/core';

import { EventDocAiEffect } from './EventDocAiEffect';

export type ClearStreamPayload = {
  // The chat whose stream to clear. Absent clears whatever is streaming; a chat that is not open is left alone.
  chatId?: string;
};

export type EventDocAiClearStreamEffect = Effect<EventDocAiEffect.ClearStream, ClearStreamPayload>;
