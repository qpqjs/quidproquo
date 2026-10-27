import { AiStreamPartType, AiStreamStartStep } from '@qpqjs/core';

export const mapAiStreamStartStep = (): AiStreamStartStep => ({
  type: AiStreamPartType.StartStep,
});
