import { AiStreamPartType, AiStreamStart } from 'quidproquo-core';

export const mapAiStreamStart = (): AiStreamStart => ({
  type: AiStreamPartType.Start,
});
