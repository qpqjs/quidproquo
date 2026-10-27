import type { AiModel, AiStreamUsage } from 'quidproquo-core';

import type { EventDocAiMessageSegment } from './EventDocAiMessageSegment';

// A finalized chat message. Stream parts never persist — they're folded into
// segments once the reply completes.
export type EventDocAiChatMessage = {
  role: 'user' | 'assistant';
  segments: EventDocAiMessageSegment[];
  // Assistant messages only: the model that produced the reply.
  model?: AiModel;
  // Assistant messages only: token usage of the execution that produced the reply, cache reads
  // and writes included, so a chat's cost can be worked out from its history and a price table.
  usage?: AiStreamUsage;
};
