import { AiStreamPartType, AiStreamRaw } from 'quidproquo-core';

export const mapAiStreamRaw = (): AiStreamRaw => ({
  type: AiStreamPartType.Raw,
});
