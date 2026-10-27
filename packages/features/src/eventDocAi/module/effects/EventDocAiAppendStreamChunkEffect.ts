import type { AiStreamPart, Effect } from 'quidproquo-core';

import { EventDocAiEffect } from './EventDocAiEffect';

export type AppendStreamChunkPayload = {
  part: AiStreamPart;
};

export type EventDocAiAppendStreamChunkEffect = Effect<EventDocAiEffect.AppendStreamChunk, AppendStreamChunkPayload>;
