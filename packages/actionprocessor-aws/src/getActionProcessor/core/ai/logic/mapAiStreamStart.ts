import { AiStreamPartType, AiStreamStart } from '@qpqjs/core';

/**
 *
 */
export const mapAiStreamStart = (): AiStreamStart => ({
  type: AiStreamPartType.Start,
});
