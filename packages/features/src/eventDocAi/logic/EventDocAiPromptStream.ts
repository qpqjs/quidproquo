import type { AiModel } from '@qpqjs/core';

import type { EventDocAiStreamHandle } from './EventDocAiStreamHandle';

/** What askEventDocAiPromptStreamOpen hands back: the open stream and the model the turn runs on. */
export type EventDocAiPromptStream = {
  streamHandle: EventDocAiStreamHandle;
  // The model the turn ran on, recorded on the saved reply.
  model: AiModel;
};
