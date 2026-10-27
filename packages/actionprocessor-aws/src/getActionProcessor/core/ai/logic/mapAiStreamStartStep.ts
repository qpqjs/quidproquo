import { AiStreamPartType, AiStreamStartStep } from 'quidproquo-core';

export const mapAiStreamStartStep = (): AiStreamStartStep => ({
  type: AiStreamPartType.StartStep,
});
