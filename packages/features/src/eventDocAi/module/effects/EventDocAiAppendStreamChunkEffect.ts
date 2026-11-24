import type { AiStreamPart, Effect } from '@qpqjs/core';

import { EventDocAiEffect } from './EventDocAiEffect';

export type AppendStreamChunkPayload = {
  part: AiStreamPart;
  // The chat the reply belongs to. A part for a chat that is not open is dropped.
  chatId?: string;
};

export type EventDocAiAppendStreamChunkEffect = Effect<EventDocAiEffect.AppendStreamChunk, AppendStreamChunkPayload>;
