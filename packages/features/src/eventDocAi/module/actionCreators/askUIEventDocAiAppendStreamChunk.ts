import { type AiStreamPart, AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import type { EventDocAiAppendStreamChunkEffect } from '../effects/EventDocAiAppendStreamChunkEffect';
import { EventDocAiEffect } from '../effects/EventDocAiEffect';

export function* askUIEventDocAiAppendStreamChunk(part: AiStreamPart): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocAiAppendStreamChunkEffect>(EventDocAiEffect.AppendStreamChunk, { part });
}
