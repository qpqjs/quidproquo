import { AiStreamPartType, AiStreamRaw } from '@qpqjs/core';

export const mapAiStreamRaw = (): AiStreamRaw => ({
  type: AiStreamPartType.Raw,
});
